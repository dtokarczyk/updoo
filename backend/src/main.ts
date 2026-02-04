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
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests without origin (same-origin requests, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow any origin on ports starting with 3 (3000, 3002, 30000, etc.)
      const portMatch = origin.match(/:3\d+(?:\/|$)/);
      if (portMatch) {
        callback(null, true);
        return;
      }
      // Reject other origins
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language'],
    credentials: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
