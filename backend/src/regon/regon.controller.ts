import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { RegonService } from './regon.service';
import { GetCompanyDataQueryDto } from './dto/get-company-data.dto';

/**
 * REST API for REGON (GUS BIR 1.2) – Polish business registry.
 * Production BIR 1.2: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 *
 * Requires REGON_API_KEY in environment (API key from GUS).
 */
@Controller('regon')
export class RegonController {
  constructor(private readonly regonService: RegonService) {}

  /**
   * Get full company data by NIP, REGON, or KRS.
   * Single method that performs login → search → full reports → logout and returns all data.
   *
   * Query: exactly one of nip, regon, krs (digits only, no spaces/dashes).
   * - nip: 10 digits
   * - regon: 9 or 14 digits
   * - krs: 10 digits
   *
   * Returns: searchResult (basic info from registry) + reports (raw XML per BIR12 report name).
   */
  @Get('company')
  async getCompanyData(@Query() query: GetCompanyDataQueryDto) {
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
