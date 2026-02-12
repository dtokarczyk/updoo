import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  NotificationType,
  NotificationFrequency,
  JobStatus,
} from '@prisma/client';
import { DEFAULT_ENABLED, DEFAULT_FREQUENCY } from './constants';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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
        skills: { include: { skill: true } },
        category: {
          include: { translations: true },
        },
      },
    });
    // Only process published jobs – never send instant notifications for drafts or when creating
    if (!job || job.status !== JobStatus.PUBLISHED) return;

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
}
