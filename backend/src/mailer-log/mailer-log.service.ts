import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerLogStatus } from '@prisma/client';

@Injectable()
export class MailerLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    recipientEmail: string;
    subject: string;
    content: string;
    status?: MailerLogStatus;
  }) {
    return this.prisma.mailerLog.create({
      data: {
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        content: data.content,
        status: data.status ?? MailerLogStatus.PENDING,
      },
    });
  }

  async update(
    id: string,
    updates: {
      status?: MailerLogStatus;
      messageId?: string | null;
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
  ) {
    await this.prisma.mailerLog.update({
      where: { id },
      data: updates,
    });
    return this.prisma.mailerLog.findUnique({ where: { id } });
  }

  async findById(id: string) {
    return this.prisma.mailerLog.findUnique({ where: { id } });
  }

  async findByMessageId(messageId: string) {
    return this.prisma.mailerLog.findFirst({
      where: { messageId },
    });
  }

  async updateByMessageId(
    messageId: string,
    updates: {
      status?: MailerLogStatus;
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
  ) {
    const log = await this.findByMessageId(messageId);
    if (!log) return null;
    return this.update(log.id, updates);
  }

  async findMany(options?: { limit?: number; orderBy?: 'asc' | 'desc' }) {
    const orderBy = { createdAt: options?.orderBy ?? ('desc' as const) };
    const take = options?.limit;
    return this.prisma.mailerLog.findMany({
      orderBy,
      ...(typeof take === 'number' && take > 0 ? { take } : {}),
    });
  }
}
