import * as path from 'path';
import { config } from 'dotenv';

// Load .env from backend directory so it works when run from project root
config({ path: path.join(__dirname, '..', '.env') });
config(); // fallback: cwd .env

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request } from 'express';
import { AppModule } from './app.module';
import { I18nValidationPipe } from './i18n/i18n-validation.pipe';

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  // Use custom Express instance so we can attach rawBody for MailerSend webhook signature verification
  const server = express();
  server.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: isDev
      ? ['log', 'error', 'warn', 'debug', 'verbose']
      : ['log', 'error', 'warn'],
  });
  app.useGlobalPipes(new I18nValidationPipe());
  app.enableCors({
    // Allow requests from any origin. Use with caution in production.
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
