import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { LinkCompanyDto } from '../auth/dto/link-company.dto';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyCompany(@GetUser() user: JwtUser) {
    const company = await this.companyService.getMyCompany(user.id);
    return { company };
  }

  @Patch()
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async updateCompany(
    @GetUser() user: JwtUser,
    @Body() dto: UpdateCompanyDto,
  ) {
    if (dto.companySize != null) {
      return this.companyService.updateCompanySize(user.id, dto.companySize);
    }
    const company = await this.companyService.getMyCompany(user.id);
    return { company };
  }

  @Post('link')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async linkCompany(@GetUser() user: JwtUser, @Body() dto: LinkCompanyDto) {
    return this.companyService.linkCompanyByNip(
      user.id,
      dto.nip,
      dto.companySize,
    );
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
