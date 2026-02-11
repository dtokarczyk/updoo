import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegonService } from '../regon/regon.service';
import type { SearchResultRow } from '../regon/regon-contact.util';
import { AccountService } from '../account/account.service';
import type { AuthResponseUser } from '../auth/auth.types';
import type { CompanyPayload } from '../auth/auth.types';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regonService: RegonService,
    private readonly accountService: AccountService,
  ) {}

  getCompanyPayload(company: {
    id: string;
    regon: string;
    nip: string;
    name: string;
    voivodeship: string | null;
    county: string | null;
    commune: string | null;
    locality: string | null;
    postalCode: string | null;
    street: string | null;
    propertyNumber: string | null;
    apartmentNumber: string | null;
    type: string | null;
    isActive: boolean;
    updatedAt: Date;
  }): CompanyPayload {
    return {
      id: company.id,
      regon: company.regon,
      nip: company.nip,
      name: company.name,
      voivodeship: company.voivodeship,
      county: company.county,
      commune: company.commune,
      locality: company.locality,
      postalCode: company.postalCode,
      street: company.street,
      propertyNumber: company.propertyNumber,
      apartmentNumber: company.apartmentNumber,
      type: company.type,
      isActive: company.isActive,
      updatedAt: company.updatedAt,
    };
  }

  /** Map GUS search row to Company create/update payload. */
  private mapGusRowToCompany(row: SearchResultRow) {
    const nip = String(row.Nip ?? '').replace(/\s/g, '');
    const regon = String(row.Regon ?? '').replace(/\s/g, '');
    if (!nip || !regon) {
      throw new BadRequestException('GUS data missing NIP or REGON');
    }
    return {
      regon,
      nip,
      name: String(row.Nazwa ?? '').trim() || '—',
      voivodeship: row.Wojewodztwo?.trim() || null,
      county: row.Powiat?.trim() || null,
      commune: row.Gmina?.trim() || null,
      locality: row.Miejscowosc?.trim() || null,
      postalCode: row.KodPocztowy?.trim() || null,
      street: row.Ulica?.trim() || null,
      propertyNumber: row.NrNieruchomosci?.trim() || null,
      apartmentNumber: row.NrLokalu?.trim() || null,
      type: row.Typ?.trim() || null,
    };
  }

  /** Get current user's linked company. Returns null if none. */
  async getMyCompany(userId: string): Promise<CompanyPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user?.companyId || !user.company) return null;
    return this.getCompanyPayload(user.company);
  }

  /** Link company to user by NIP: find in DB or fetch from GUS, create, then assign. */
  async linkCompanyByNip(
    userId: string,
    nipRaw: string,
  ): Promise<{
    user: AuthResponseUser;
    company: CompanyPayload;
  }> {
    const nip = String(nipRaw).replace(/\s/g, '').replace(/-/g, '');
    if (!/^\d{10}$/.test(nip)) {
      throw new BadRequestException('validation.nipInvalid');
    }

    let company = await this.prisma.company.findUnique({ where: { nip } });
    if (!company) {
      const gus = await this.regonService.getCompanyDataByNipRegonOrKrs(nip);
      if (!gus.searchResult.length) {
        throw new BadRequestException('messages.companyNotFoundInGus');
      }
      const data = this.mapGusRowToCompany(gus.searchResult[0]);
      company = await this.prisma.company.create({ data });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    const user = await this.accountService.getUserForResponse(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { user, company: this.getCompanyPayload(company) };
  }

  /** Refresh current user's company data from GUS. */
  async refreshCompany(userId: string): Promise<{ company: CompanyPayload }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });
    if (!user?.companyId || !user.company) {
      throw new NotFoundException('messages.noCompanyLinked');
    }
    const gus = await this.regonService.getCompanyDataByNipRegonOrKrs(
      user.company.nip,
    );
    if (!gus.searchResult.length) {
      throw new BadRequestException('messages.companyNotFoundInGus');
    }
    const data = this.mapGusRowToCompany(gus.searchResult[0]);
    const company = await this.prisma.company.update({
      where: { id: user.company.id },
      data,
    });
    return { company: this.getCompanyPayload(company) };
  }
}
