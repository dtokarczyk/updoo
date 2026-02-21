import {
  Controller,
  Get,
  Query,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { RegonService } from './regon.service';
import { GetCompanyDataQueryDto } from './dto/get-company-data.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';

/**
 * REST API for REGON (GUS BIR 1.2) - Polish business registry.
 * Production BIR 1.2: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 *
 * Requires REGON_API_KEY in environment (API key from GUS).
 * Only users with accountType ADMIN can call these endpoints.
 */
@Controller('regon')
export class RegonController {
  constructor(private readonly regonService: RegonService) { }

  /**
   * Get full company data by NIP, REGON, or KRS.
   * Single method that performs login → search → full reports → logout and returns all data.
   *
   * Query: exactly one of nip, regon, krs (digits only, no spaces/dashes).
   * - nip: 10 digits
   * - regon: 9 or 14 digits
   * - krs: 10 digits
   *
   * Returns: searchResult (basic info from registry) + reports (parsed JSON).
   */
  @Get('company')
  @UseGuards(JwtAuthGuard)
  async getCompanyData(
    @Query() query: GetCompanyDataQueryDto,
    @GetUser() user: JwtUser,
  ) {
    if (user.accountType !== 'ADMIN') {
      throw new ForbiddenException('Only admin users can query REGON');
    }
    const { nip, regon, krs } = query;
    const count = [nip, regon, krs].filter((v) => v != null && v !== '').length;
    if (count === 0) {
      throw new BadRequestException('Provide exactly one of: nip, regon, krs');
    }
    if (count > 1) {
      throw new BadRequestException('Provide only one of: nip, regon, krs');
    }
    return this.regonService.getCompanyDataByNipRegonOrKrs(nip, regon, krs);
  }
}
