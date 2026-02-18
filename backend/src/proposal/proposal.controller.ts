import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { AdminGuard } from '../admin/admin.guard';
import { I18nService } from '../i18n/i18n.service';
import type { SupportedLanguage } from '../i18n/i18n.service';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalTokenDto } from './dto/accept-reject.dto';

@Controller('proposals')
export class ProposalController {
  constructor(
    private readonly proposalService: ProposalService,
    private readonly i18nService: I18nService,
  ) {}

  private getLanguage(acceptLanguage?: string): SupportedLanguage {
    return this.i18nService.parseLanguageFromHeader(acceptLanguage);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(
    @Body() dto: CreateProposalDto,
    @Headers('accept-language') acceptLanguage?: string,
    @GetUser() user?: JwtUser,
  ) {
    const lang = this.getLanguage(acceptLanguage) as 'pl' | 'en';
    return this.proposalService.create(dto, lang, user!.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const pageSizeNum = Math.min(
      50,
      Math.max(1, parseInt(pageSize ?? '20', 10) || 20),
    );
    const offset = (pageNum - 1) * pageSizeNum;
    return this.proposalService.list(pageSizeNum, offset);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    return this.proposalService.stats();
  }

  @Get('by-token')
  async getByToken(@Query('token') token: string) {
    if (!token?.trim()) return null;
    return this.proposalService.getByToken(token.trim());
  }

  @Post('accept')
  async accept(
    @Body() dto: ProposalTokenDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = this.getLanguage(acceptLanguage) as 'pl' | 'en';
    return this.proposalService.accept(dto.token, lang);
  }

  @Post('reject')
  async reject(
    @Body() dto: ProposalTokenDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const lang = this.getLanguage(acceptLanguage) as 'pl' | 'en';
    return this.proposalService.reject(dto.token);
  }
}
