import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser, JwtUser } from '../auth/get-user.decorator';

class GenerateTextDto {
  prompt!: string;
  modelName?: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }
}

