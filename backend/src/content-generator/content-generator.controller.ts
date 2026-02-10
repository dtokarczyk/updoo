import {
  Controller,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { ContentGeneratorService } from './content-generator.service';

@Controller('content-generator')
export class ContentGeneratorController {
  constructor(
    private readonly contentGeneratorService: ContentGeneratorService,
  ) {}

  @Post('generate-job')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  async generateJob(@GetUser() user: JwtUser) {
    if (user.accountType !== 'ADMIN') {
      throw new ForbiddenException('Only admin users can generate jobs');
    }

    const job = await this.contentGeneratorService.generateAndCreateJob();
    return {
      ok: true,
      message: 'Job generated and added successfully',
      job,
    };
  }
}
