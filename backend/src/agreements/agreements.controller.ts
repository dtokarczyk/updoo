import { Controller, Get } from '@nestjs/common';
import { AgreementsService } from './agreements.service';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  /** Public: current terms of service markdown. No auth. */
  @Get('terms')
  getTerms(): { content: string } {
    const content = this.agreementsService.getCurrentTermsContent();
    return { content };
  }

  /** Public: current privacy policy markdown. No auth. */
  @Get('privacy-policy')
  getPrivacyPolicy(): { content: string } {
    const content = this.agreementsService.getCurrentPrivacyPolicyContent();
    return { content };
  }
}
