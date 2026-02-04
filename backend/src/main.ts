import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { I18nValidationPipe } from './i18n/i18n-validation.pipe';

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: isDev
      ? ['log', 'error', 'warn', 'debug', 'verbose']
      : ['log', 'error', 'warn'],
  });
  app.useGlobalPipes(new I18nValidationPipe());
  const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const allowedOrigins = [
    frontendOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter((o, i, a) => a.indexOf(o) === i);
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
