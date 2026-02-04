import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) { }

  /** Add job to user's favorites. Idempotent. */
  async addFavorite(userId: string, jobId: string): Promise<{ ok: boolean }> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });
    if (!job || job.status !== JobStatus.PUBLISHED) {
      throw new NotFoundException('Job not found');
    }
    await this.prisma.favorite.upsert({
      where: {
        userId_jobId: { userId, jobId },
      },
      create: { userId, jobId },
      update: {},
    });
    return { ok: true };
  }

  /** Remove job from user's favorites. Idempotent. */
  async removeFavorite(userId: string, jobId: string): Promise<{ ok: boolean }> {
    await this.prisma.favorite.deleteMany({
      where: { userId, jobId },
    });
    return { ok: true };
  }

  /** Get set of job IDs that the user has favorited. */
  async getFavoriteJobIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { jobId: true },
    });
    return new Set(rows.map((r) => r.jobId));
  }

  /** Get full jobs that the user has favorited (for favorites page). Only published. */
  async getFavoriteJobs(userId: string, userLanguage: any) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            category: {
              include: {
                translations: {
                  where: { language: userLanguage },
                },
              },
            },
            author: { select: { id: true, email: true, name: true, surname: true } },
            location: true,
            skills: { include: { skill: true } },
          },
        },
      },
    });
    return favorites
      .map((f) => f.job)
      .filter((j) => j.status === JobStatus.PUBLISHED)
      .map((l) => ({
        ...l,
        category: {
          id: l.category.id,
          slug: l.category.slug,
          name: l.category.translations[0]?.name || l.category.slug,
        },
        isFavorite: true,
      }));
  }
}
