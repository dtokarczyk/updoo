import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  NotificationType,
  NotificationFrequency,
  JobStatus,
} from '@prisma/client';
import { FAKE_PASSWORD } from '../mailer/constants';
import { DEFAULT_ENABLED, DEFAULT_FREQUENCY } from './constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Returns true if the job should be excluded from notification emails (newsletter, digest, instant).
   * Central place for all rules – add new conditions here.
   */
  private shouldExcludeJobFromNotificationEmails(job: {
    author?: { password: string | null } | null;
  }): boolean {
    // Exclude jobs from auto-generated (fake) accounts
    if (job.author?.password === FAKE_PASSWORD) return true;
    return false;
  }

  // ──────────────────────────── Preferences CRUD ────────────────────────────

  /** Get all notification preferences for user (fills defaults for missing types). */
  async getPreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });

    const allTypes = Object.values(NotificationType);
    return allTypes.map((type) => {
      const pref = existing.find((p) => p.type === type);
      return {
        type,
        enabled: pref?.enabled ?? DEFAULT_ENABLED,
        frequency: pref?.frequency ?? DEFAULT_FREQUENCY,
      };
    });
  }

  /** Upsert a single notification preference for a user. */
  async updatePreference(
    userId: string,
    type: NotificationType,
    enabled?: boolean,
    frequency?: NotificationFrequency,
  ) {
    const data: { enabled?: boolean; frequency?: NotificationFrequency } = {};
    if (enabled !== undefined) data.enabled = enabled;
    if (frequency !== undefined) data.frequency = frequency;

    const result = await this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      create: {
        userId,
        type,
        enabled: enabled ?? DEFAULT_ENABLED,
        frequency: frequency ?? DEFAULT_FREQUENCY,
      },
      update: data,
    });

    return {
      type: result.type,
      enabled: result.enabled,
      frequency: result.frequency,
    };
  }

  // ──────────────────────────── Job publish trigger ─────────────────────────

  /**
   * Called only when a job is published (status change to PUBLISHED), not when a job is created.
   * Finds freelancers whose skills overlap with the job's skills and either sends an instant
   * email or queues for daily digest. Instant emails are sent only for published jobs.
   */
  async onJobPublished(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        author: { select: { password: true } },
        skills: { include: { skill: true } },
        category: {
          include: { translations: true },
        },
      },
    });
    // Only process published jobs – never send instant notifications for drafts or when creating
    if (!job || job.status !== JobStatus.PUBLISHED) return;
    if (this.shouldExcludeJobFromNotificationEmails(job)) return;

    const jobSkillIds = job.skills.map((js) => js.skillId);
    if (jobSkillIds.length === 0) return; // no skills – no matching

    // Find freelancer users who have at least one matching skill
    const matchingUsers = await this.prisma.user.findMany({
      where: {
        accountType: 'FREELANCER',
        skills: {
          some: {
            skillId: { in: jobSkillIds },
          },
        },
        // Exclude the job author
        id: { not: job.authorId },
      },
      include: {
        notificationPreferences: {
          where: { type: NotificationType.NEW_JOB_MATCHING_SKILLS },
        },
        skills: { include: { skill: true } },
      },
    });

    for (const user of matchingUsers) {
      const pref = user.notificationPreferences[0];
      const enabled = pref?.enabled ?? DEFAULT_ENABLED;
      if (!enabled) continue;

      const frequency = pref?.frequency ?? DEFAULT_FREQUENCY;

      // Create notification log entry
      await this.prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: NotificationType.NEW_JOB_MATCHING_SKILLS,
          jobId: job.id,
          dispatched: frequency === NotificationFrequency.INSTANT,
        },
      });

      if (frequency === NotificationFrequency.INSTANT) {
        // Send email immediately
        await this.sendNewJobEmail(user, job);
      }
      // DAILY_DIGEST: notification log created with dispatched=false, will be
      // picked up by daily digest cron.
    }

    this.logger.log(
      `Processed notifications for job ${jobId}: ${matchingUsers.length} matching user(s)`,
    );
  }

  // ──────────────────────────── New application to my job ───────────────────

  /**
   * Called when a freelancer applies to a job. If the job author has
   * NEW_APPLICATION_TO_MY_JOB preference enabled, sends an instant email.
   */
  async onNewApplicationToMyJob(
    jobId: string,
    freelancerId: string,
  ): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        author: true,
        applications: {
          where: { freelancerId },
          take: 1,
          include: {
            freelancer: {
              select: { name: true, surname: true },
            },
          },
        },
      },
    });
    if (!job || job.status !== JobStatus.PUBLISHED) return;

    const authorId = job.authorId;
    if (authorId === freelancerId) return; // should not happen

    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: authorId,
          type: NotificationType.NEW_APPLICATION_TO_MY_JOB,
        },
      },
    });
    const enabled = pref?.enabled ?? DEFAULT_ENABLED;
    if (!enabled) return;

    const author = job.author;
    const application = job.applications[0];
    const freelancer = application?.freelancer;
    const isPolish = author.language === 'POLISH';
    const applicantName =
      freelancer?.name && freelancer?.surname
        ? `${freelancer.name} ${freelancer.surname.charAt(0)}.`
        : (freelancer?.name ?? (isPolish ? 'Ktoś' : 'Someone'));

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const jobUrl = `${frontendUrl}/job/${job.id}`;
    const userName = author.name ?? '';

    const subject = isPolish
      ? `Nowe zgłoszenie do Twojej oferty: ${job.title}`
      : `New application to your job: ${job.title}`;

    const greeting = userName
      ? isPolish
        ? `Cześć ${userName}!`
        : `Hi ${userName}!`
      : isPolish
        ? 'Cześć!'
        : 'Hi!';

    const html = `
      <p>${greeting}</p>
      <p>${isPolish ? 'Otrzymałeś nowe zgłoszenie do swojej oferty:' : 'You received a new application to your job:'}</p>
      <h2 style="margin:16px 0 8px;"><a href="${jobUrl}" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(job.title)}</a></h2>
      <p><strong>${isPolish ? 'Zgłosił się' : 'Applicant'}:</strong> ${this.escapeHtml(applicantName)}</p>
      <p>
        <a href="${jobUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          ${isPolish ? 'Zobacz zgłoszenia' : 'View applications'}
        </a>
      </p>
      <p style="color:#888;font-size:12px;">${isPolish ? 'Możesz wyłączyć te powiadomienia w ustawieniach profilu.' : 'You can disable these notifications in your profile settings.'}</p>
      <p>Hoplo</p>
    `;

    try {
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(author.email, subject, html);
      } else {
        this.logger.warn(
          `Email not configured – skipping new-application notification to ${author.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send new-application notification to ${author.email}`,
        error,
      );
    }
  }

  // ──────────────────────────── Daily digest cron ───────────────────────────

  /** Runs every day at 06:00 UTC. Sends digest emails for undispatched notifications. Only includes jobs that are still PUBLISHED. */
  @Cron('0 6 * * *')
  async sendDailyDigest(): Promise<void> {
    this.logger.log('Running daily digest cron…');

    // Find all undispatched notification logs
    const pending = await this.prisma.notificationLog.findMany({
      where: {
        dispatched: false,
        type: NotificationType.NEW_JOB_MATCHING_SKILLS,
      },
      include: {
        user: true,
        job: {
          include: {
            author: { select: { password: true } },
            skills: { include: { skill: true } },
            category: { include: { translations: true } },
          },
        },
      },
    });

    if (pending.length === 0) {
      this.logger.log('Daily digest: nothing to send.');
      return;
    }

    // Logs for jobs that are no longer published: mark as dispatched so we don't retry every day
    const skipLogIds: string[] = [];

    // Group by user – only include jobs that are still PUBLISHED
    const byUser = new Map<
      string,
      {
        user: (typeof pending)[0]['user'];
        jobs: NonNullable<(typeof pending)[0]['job']>[];
        logIds: string[];
      }
    >();

    for (const log of pending) {
      if (!log.job) {
        skipLogIds.push(log.id);
        continue; // job was deleted
      }
      if (log.job.status !== JobStatus.PUBLISHED) {
        skipLogIds.push(log.id);
        continue; // only send digest for published jobs
      }
      if (this.shouldExcludeJobFromNotificationEmails(log.job)) {
        skipLogIds.push(log.id);
        continue;
      }
      const entry = byUser.get(log.userId) ?? {
        user: log.user,
        jobs: [],
        logIds: [],
      };
      entry.jobs.push(log.job);
      entry.logIds.push(log.id);
      byUser.set(log.userId, entry);
    }

    if (skipLogIds.length > 0) {
      await this.prisma.notificationLog.updateMany({
        where: { id: { in: skipLogIds } },
        data: { dispatched: true },
      });
    }

    for (const [, { user, jobs, logIds }] of byUser) {
      if (jobs.length === 0) continue;

      await this.sendDigestEmail(user, jobs);

      // Mark as dispatched
      await this.prisma.notificationLog.updateMany({
        where: { id: { in: logIds } },
        data: { dispatched: true },
      });
    }

    this.logger.log(
      `Daily digest sent to ${byUser.size} user(s), ${pending.length} notification(s).`,
    );
  }

  // ──────────────────────────── Email builders ──────────────────────────────

  private async sendNewJobEmail(
    user: { email: string; name: string | null; language: string },
    job: {
      id: string;
      title: string;
      skills: { skill: { name: string } }[];
      category: { translations: { language: string; name: string }[] } | null;
    },
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const jobUrl = `${frontendUrl}/job/${job.id}`;
    const userName = user.name ?? '';
    const skillNames = job.skills.map((s) => s.skill.name).join(', ');
    const isPolish = user.language === 'POLISH';

    const categoryName =
      job.category?.translations.find((t) => t.language === user.language)
        ?.name ??
      job.category?.translations[0]?.name ??
      '';

    const subject = isPolish
      ? `Nowa oferta pasująca do Twoich umiejętności: ${job.title}`
      : `New job matching your skills: ${job.title}`;

    const greeting = userName
      ? isPolish
        ? `Cześć ${userName}!`
        : `Hi ${userName}!`
      : isPolish
        ? 'Cześć!'
        : 'Hi!';

    const html = `
      <p>${greeting}</p>
      <p>${isPolish ? 'Pojawiła się nowa oferta pasująca do Twoich umiejętności:' : 'A new job matching your skills has been posted:'}</p>
      <h2 style="margin:16px 0 8px;"><a href="${jobUrl}" style="color:#2563eb;text-decoration:none;">${this.escapeHtml(job.title)}</a></h2>
      ${categoryName ? `<p><strong>${isPolish ? 'Kategoria' : 'Category'}:</strong> ${this.escapeHtml(categoryName)}</p>` : ''}
      <p><strong>${isPolish ? 'Pasujące umiejętności' : 'Matching skills'}:</strong> ${this.escapeHtml(skillNames)}</p>
      <p>
        <a href="${jobUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
          ${isPolish ? 'Zobacz ofertę' : 'View job'}
        </a>
      </p>
      <p style="color:#888;font-size:12px;">${isPolish ? 'Możesz zmienić ustawienia powiadomień w swoim profilu.' : 'You can change notification settings in your profile.'}</p>
      <p>Hoplo</p>
    `;

    try {
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(user.email, subject, html);
      } else {
        this.logger.warn(
          `Email not configured – skipping notification to ${user.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send instant notification to ${user.email}`,
        error,
      );
    }
  }

  private async sendDigestEmail(
    user: { email: string; name: string | null; language: string },
    jobs: {
      id: string;
      title: string;
      skills: { skill: { name: string } }[];
      category: { translations: { language: string; name: string }[] } | null;
    }[],
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const userName = user.name ?? '';
    const isPolish = user.language === 'POLISH';

    const subject = isPolish
      ? `Podsumowanie nowych ofert – ${jobs.length} ofert(y) pasujących do Twoich umiejętności`
      : `Daily job digest – ${jobs.length} job(s) matching your skills`;

    const greeting = userName
      ? isPolish
        ? `Cześć ${userName}!`
        : `Hi ${userName}!`
      : isPolish
        ? 'Cześć!'
        : 'Hi!';

    const jobsList = jobs
      .map((job) => {
        const url = `${frontendUrl}/job/${job.id}`;
        const skills = job.skills.map((s) => s.skill.name).join(', ');
        return `
          <li style="margin-bottom:12px;">
            <a href="${url}" style="color:#2563eb;text-decoration:none;font-weight:bold;">${this.escapeHtml(job.title)}</a>
            ${skills ? `<br/><span style="color:#666;">${isPolish ? 'Umiejętności' : 'Skills'}: ${this.escapeHtml(skills)}</span>` : ''}
          </li>
        `;
      })
      .join('');

    const html = `
      <p>${greeting}</p>
      <p>${isPolish ? 'Oto nowe oferty pasujące do Twoich umiejętności z ostatnich 24 godzin:' : 'Here are new jobs matching your skills from the last 24 hours:'}</p>
      <ul style="padding-left:20px;">${jobsList}</ul>
      <p style="color:#888;font-size:12px;">${isPolish ? 'Możesz zmienić ustawienia powiadomień w swoim profilu.' : 'You can change notification settings in your profile.'}</p>
      <p>Hoplo</p>
    `;

    try {
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(user.email, subject, html);
      } else {
        this.logger.warn(
          `Email not configured – skipping digest to ${user.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send digest notification to ${user.email}`,
        error,
      );
    }
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ──────────────────────────── Category follow (newsletter) ────────────────────────────

  /** Subscribe user to category newsletter. Returns list of followed category IDs. */
  async addCategoryFollow(
    userId: string,
    categoryId: string,
  ): Promise<string[]> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    await this.prisma.categoryFollow.upsert({
      where: {
        userId_categoryId: { userId, categoryId },
      },
      create: { userId, categoryId },
      update: {},
    });
    return this.getFollowedCategoryIds(userId);
  }

  /** Unsubscribe user from category newsletter. */
  async removeCategoryFollow(
    userId: string,
    categoryId: string,
  ): Promise<string[]> {
    await this.prisma.categoryFollow.deleteMany({
      where: { userId, categoryId },
    });
    return this.getFollowedCategoryIds(userId);
  }

  /** Get list of category IDs the user is following. */
  async getFollowedCategoryIds(userId: string): Promise<string[]> {
    const follows = await this.prisma.categoryFollow.findMany({
      where: { userId },
      select: { categoryId: true },
    });
    return follows.map((f) => f.categoryId);
  }

  /** Runs daily at 06:00 UTC. Sends category newsletter: new jobs from followed categories (last 24h). */
  @Cron('0 6 * * *')
  async sendCategoryNewsletter(): Promise<void> {
    this.logger.log('Running category newsletter cron…');

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const follows = await this.prisma.categoryFollow.findMany({
      where: {},
      include: {
        user: true,
        category: {
          include: { translations: true },
        },
      },
    });

    if (follows.length === 0) {
      this.logger.log('Category newsletter: no subscribers.');
      return;
    }

    // Group by user
    const byUser = new Map<
      string,
      {
        user: (typeof follows)[0]['user'];
        categoryIds: string[];
      }
    >();
    for (const f of follows) {
      const entry = byUser.get(f.userId) ?? {
        user: f.user,
        categoryIds: [],
      };
      if (!entry.categoryIds.includes(f.categoryId)) {
        entry.categoryIds.push(f.categoryId);
      }
      byUser.set(f.userId, entry);
    }

    // Only send to users who have category newsletter enabled
    const userIds = [...byUser.keys()];
    const categoryPrefs = await this.prisma.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type: NotificationType.NEW_JOBS_IN_FOLLOWED_CATEGORIES,
      },
      select: { userId: true, enabled: true },
    });
    const disabledUserIds = new Set(
      categoryPrefs.filter((p) => !p.enabled).map((p) => p.userId),
    );
    // Default for missing preference is enabled
    const usersToEmail = userIds.filter((id) => !disabledUserIds.has(id));

    let sent = 0;
    for (const userId of usersToEmail) {
      const entry = byUser.get(userId);
      if (!entry) continue;
      const { user, categoryIds } = entry;
      const allJobs = await this.prisma.job.findMany({
        where: {
          status: JobStatus.PUBLISHED,
          categoryId: { in: categoryIds },
          createdAt: { gte: since },
        },
        include: {
          author: { select: { password: true } },
          skills: { include: { skill: true } },
          category: { include: { translations: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const jobs = allJobs.filter(
        (j) => !this.shouldExcludeJobFromNotificationEmails(j),
      );
      if (jobs.length === 0) continue;

      await this.sendCategoryNewsletterEmail(user, jobs);
      sent++;
    }

    this.logger.log(
      `Category newsletter sent to ${sent} user(s), ${usersToEmail.length}/${byUser.size} with follows and preference enabled.`,
    );
  }

  private async sendCategoryNewsletterEmail(
    user: { email: string; name: string | null; language: string },
    jobs: {
      id: string;
      title: string;
      skills: { skill: { name: string } }[];
      category: { translations: { language: string; name: string }[] } | null;
    }[],
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const userName = user.name ?? '';
    const isPolish = user.language === 'POLISH';

    const subject = isPolish
      ? `Newsletter kategorii – ${jobs.length} nowych ogłoszeń`
      : `Category newsletter – ${jobs.length} new job(s)`;

    const greeting = userName
      ? isPolish
        ? `Cześć ${userName}!`
        : `Hi ${userName}!`
      : isPolish
        ? 'Cześć!'
        : 'Hi!';

    const jobsList = jobs
      .map((job) => {
        const url = `${frontendUrl}/job/${job.id}`;
        const skills = job.skills.map((s) => s.skill.name).join(', ');
        const categoryName =
          job.category?.translations.find((t) => t.language === user.language)
            ?.name ??
          job.category?.translations[0]?.name ??
          '';
        return `
          <li style="margin-bottom:12px;">
            <a href="${url}" style="color:#2563eb;text-decoration:none;font-weight:bold;">${this.escapeHtml(job.title)}</a>
            ${categoryName ? `<br/><span style="color:#666;">${isPolish ? 'Kategoria' : 'Category'}: ${this.escapeHtml(categoryName)}</span>` : ''}
            ${skills ? `<br/><span style="color:#666;">${isPolish ? 'Umiejętności' : 'Skills'}: ${this.escapeHtml(skills)}</span>` : ''}
          </li>
        `;
      })
      .join('');

    const html = `
      <p>${greeting}</p>
      <p>${isPolish ? 'Oto nowe ogłoszenia z obserwowanych kategorii z ostatnich 24 godzin:' : 'Here are new jobs from your followed categories from the last 24 hours:'}</p>
      <ul style="padding-left:20px;">${jobsList}</ul>
      <p style="color:#888;font-size:12px;">${isPolish ? 'Możesz zarządzać obserwowanymi kategoriami na stronie danej kategorii.' : 'You can manage followed categories on each category page.'}</p>
      <p>Hoplo</p>
    `;

    try {
      if (this.emailService.isConfigured()) {
        await this.emailService.sendHtml(user.email, subject, html);
      } else {
        this.logger.warn(
          `Email not configured – skipping category newsletter to ${user.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send category newsletter to ${user.email}`,
        error,
      );
    }
  }
}
