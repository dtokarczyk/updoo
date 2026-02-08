import { Controller, Get, Param } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import type { CurrentVersions } from './agreements.service';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  /** Public: current required versions (terms + privacy). No auth. */
  @Get('versions')
  getVersions(): CurrentVersions {
    return this.agreementsService.getCurrentVersions();
  }

  @Get('terms-of-service/:version')
  getTerms(@Param('version') version: string): { content: string } {
    const content = this.agreementsService.getTermsContent(version);
    return { content };
  }

  @Get('privacy-policy/:version')
  getPrivacyPolicy(@Param('version') version: string): { content: string } {
    const content = this.agreementsService.getPrivacyPolicyContent(version);
    return { content };
  }
}
