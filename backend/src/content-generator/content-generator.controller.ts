import { Controller, Post, UseGuards, ForbiddenException } from '@nestjs/common';
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
  @UseGuards(JwtAuthGuard)
  async generateJob(@GetUser() user: JwtUser) {
    if (user.accountType !== 'ADMIN') {
      throw new ForbiddenException('Only admin users can generate jobs');
    }

    const result = await this.contentGeneratorService.generateAiJobPostForRandomCategory();
    if (!result) {
      return { ok: false, message: 'Failed to generate job: no categories available' };
    }
    return { 
      ok: true, 
      message: `Job generated successfully in category ${result.categorySlug}`,
      jobId: result.jobId,
      categorySlug: result.categorySlug,
    };
  }
}
