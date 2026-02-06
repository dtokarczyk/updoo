import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly defaultModelName = 'gemini-2.0-flash';
  private client: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY ?? '';
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY is not set. AI features will be disabled.');
    } else {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  private getModelName(modelName?: string): string {
    return modelName ?? this.defaultModelName;
  }

  /**
   * Thin wrapper around Google Gen AI generateContent.
   * Accepts the same request object shape as ai.models.generateContent().
   */
  async generateText(
    args: Parameters<GoogleGenAI['models']['generateContent']>[0],
  ): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException('AI client is not configured. Missing GOOGLE_AI_API_KEY.');
    }

    const model = this.getModelName(args.model);
    try {
      console.log('Generating text with model:', await this.client.models.list());
      const result = await this.client.models.generateContent({
        ...args,
        model,
      });

      const text = result.text;
      if (!text) {
        throw new Error('Empty text response from Gemini');
      }
      return text;
    } catch (error) {
      this.logger.error('Failed to generate text with Gemini', error as Error);
      throw new InternalServerErrorException('Failed to generate text with Gemini.');
    }
  }

}

