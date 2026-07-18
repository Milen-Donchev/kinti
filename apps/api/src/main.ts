import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { PrismaExceptionFilter } from './prisma-exceptions-filter';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
