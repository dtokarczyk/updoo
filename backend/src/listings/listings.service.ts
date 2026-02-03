import { ForbiddenException, Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Usługi', slug: 'uslugi' },
  { name: 'Sprzedaż', slug: 'sprzedaz' },
  { name: 'Praca', slug: 'praca' },
  { name: 'Nieruchomości', slug: 'nieruchomosci' },
  { name: 'Motoryzacja', slug: 'motoryzacja' },
  { name: 'Inne', slug: 'inne' },
];

@Injectable()
export class ListingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    await this.ensureCategories();
  }

  private async ensureCategories() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      await this.prisma.category.createMany({ data: DEFAULT_CATEGORIES });
    }
  }

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createListing(authorId: string, accountType: string | null, dto: CreateListingDto) {
    if (accountType !== 'CLIENT') {
      throw new ForbiddenException('Tylko klienci mogą tworzyć ogłoszenia');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.listing.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        authorId,
      },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async getFeed(take = 50, cursor?: string) {
    const listings = await this.prisma.listing.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        author: { select: { id: true, email: true, name: true } },
      },
    });
    const hasMore = listings.length > take;
    const items = hasMore ? listings.slice(0, take) : listings;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;
    return { items, nextCursor };
  }
}
