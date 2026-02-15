import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getRealUsers();
  }

  @Get('mailer-log')
  async getMailerLog() {
    return this.adminService.getMailerLogs();
  }

  @Post('send-test-email')
  async sendTestEmail(@GetUser() user: JwtUser) {
    return this.adminService.sendTestEmail(user);
  }

  /** Regenerate OG image for a job (upload to storage and update job.ogImageUrl). */
  @Post('jobs/:id/regenerate-og-image')
  async regenerateJobOgImage(@Param('id') jobId: string) {
    return this.adminService.regenerateJobOgImage(jobId);
  }
}
