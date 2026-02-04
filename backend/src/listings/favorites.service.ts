import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingStatus } from '@prisma/client';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) { }

  /** Add listing to user's favorites. Idempotent. */
  async addFavorite(userId: string, listingId: string): Promise<{ ok: boolean }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });
    if (!listing || listing.status !== ListingStatus.PUBLISHED) {
      throw new NotFoundException('Listing not found');
    }
    await this.prisma.favorite.upsert({
      where: {
        userId_listingId: { userId, listingId },
      },
      create: { userId, listingId },
      update: {},
    });
    return { ok: true };
  }

  /** Remove listing from user's favorites. Idempotent. */
  async removeFavorite(userId: string, listingId: string): Promise<{ ok: boolean }> {
    await this.prisma.favorite.deleteMany({
      where: { userId, listingId },
    });
    return { ok: true };
  }

  /** Get set of listing IDs that the user has favorited. */
  async getFavoriteListingIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return new Set(rows.map((r) => r.listingId));
  }

  /** Get full listings that the user has favorited (for favorites page). Only published. */
  async getFavoriteListings(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            category: true,
            author: { select: { id: true, email: true, name: true, surname: true } },
            location: true,
            skills: { include: { skill: true } },
          },
        },
      },
    });
    return favorites
      .map((f) => f.listing)
      .filter((l) => l.status === ListingStatus.PUBLISHED)
      .map((l) => ({ ...l, isFavorite: true }));
  }
}
