import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContentGeneratorService } from './content-generator.service';

/** Max number of AI-generated job posts to add per day. */
const MAX_POSTS_PER_DAY =
  parseInt(process.env.CONTENT_GENERATOR_MAX_POSTS_PER_DAY ?? '5', 10) || 5;

/** Hour range for posting (inclusive). Posts only between 6:00 and 23:59. */
const HOUR_START = 6;
const HOUR_END = 23;

interface DailySlot {
  hour: number;
  minute: number;
}

@Injectable()
export class ContentGeneratorSchedulerService implements OnModuleDestroy {
  private readonly logger = new Logger(ContentGeneratorSchedulerService.name);

  /** Today's schedule: up to MAX_POSTS_PER_DAY slots at random (hour, minute) in [6..23]. */
  private dailySchedule: DailySlot[] = [];
  private scheduleDateKey = '';

  /** Pending timeout for "run at random minute" within current hour. Cleared on destroy. */
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly contentGenerator: ContentGeneratorService) {}

  onModuleDestroy() {
    if (this.pendingTimeout != null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  /**
   * Ensures we have a schedule for today. Regenerates if date changed.
   * Slots are random (hour, minute) with hour in [HOUR_START..HOUR_END], minute in [0..59].
   */
  private ensureDailySchedule(): void {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    if (this.scheduleDateKey === key && this.dailySchedule.length > 0) {
      return;
    }
    this.scheduleDateKey = key;
    this.dailySchedule = this.buildDailySlots();
    this.logger.log(
      `Daily schedule (${MAX_POSTS_PER_DAY} posts): ${this.dailySchedule.map((s) => `${s.hour}:${String(s.minute).padStart(2, '0')}`).join(', ')}`,
    );
  }

  /**
   * Builds up to MAX_POSTS_PER_DAY random (hour, minute) slots between HOUR_START and HOUR_END.
   */
  private buildDailySlots(): DailySlot[] {
    const slots: DailySlot[] = [];
    const hours = HOUR_END - HOUR_START + 1;
    const count = Math.min(MAX_POSTS_PER_DAY, hours * 60);
    const seen = new Set<string>();
    let attempts = 0;
    const maxAttempts = count * 3;
    while (slots.length < count && attempts < maxAttempts) {
      attempts++;
      const hour = HOUR_START + Math.floor(Math.random() * hours);
      const minute = Math.floor(Math.random() * 60);
      const key = `${hour}:${minute}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ hour, minute });
    }
    slots.sort((a, b) =>
      a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute,
    );
    return slots;
  }

  /**
   * Hourly cron: runs at minute 0 of every hour.
   * If current hour is in today's schedule, either runs immediately (minute 0) or schedules run at the random minute.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async onHourlyTick(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    this.ensureDailySchedule();
    const slot = this.dailySchedule.find((s) => s.hour === currentHour);
    if (!slot) return;

    if (this.pendingTimeout != null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (slot.minute === 0) {
      await this.runGenerateAndCreateJob();
      return;
    }

    const delayMs =
      slot.minute * 60 * 1000 -
      currentMinute * 60 * 1000 -
      now.getSeconds() * 1000 -
      now.getMilliseconds();
    if (delayMs <= 0) return;
    this.logger.log(
      `Scheduling post in ${Math.round(delayMs / 1000)}s (at ${currentHour}:${String(slot.minute).padStart(2, '0')}).`,
    );
    this.pendingTimeout = setTimeout(() => {
      this.pendingTimeout = null;
      this.runGenerateAndCreateJob().catch((err) =>
        this.logger.error('Scheduled job creation failed', err),
      );
    }, delayMs);
  }

  private async runGenerateAndCreateJob(): Promise<void> {
    try {
      await this.contentGenerator.generateAndCreateJob();
    } catch (err) {
      this.logger.error('generateAndCreateJob failed', err);
    }
  }
}
