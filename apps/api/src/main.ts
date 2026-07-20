import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { PrismaExceptionFilter } from './prisma-exceptions-filter';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.WEB_ORIGIN,
    ].filter(Boolean) as string[],
    credentials: true,
  });
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
