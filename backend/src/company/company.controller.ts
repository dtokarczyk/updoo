import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { LinkCompanyDto } from '../auth/dto/link-company.dto';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyCompany(@GetUser() user: JwtUser) {
    const company = await this.companyService.getMyCompany(user.id);
    return { company };
  }

  @Post('link')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async linkCompany(@GetUser() user: JwtUser, @Body() dto: LinkCompanyDto) {
    return this.companyService.linkCompanyByNip(user.id, dto.nip);
  }

  @Post('unlink')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async unlinkCompany(@GetUser() user: JwtUser) {
    return this.companyService.unlinkCompany(user.id);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async refreshCompany(@GetUser() user: JwtUser) {
    return this.companyService.refreshCompany(user.id);
  }
}
