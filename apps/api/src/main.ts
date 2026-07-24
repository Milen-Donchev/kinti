import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

import { AppExceptionFilter } from './app-exception-filter';
import { requestIdMiddleware } from './observability/request-id.middleware';
import { RequestLoggingInterceptor } from './observability/request-logging.interceptor';
import { PrismaExceptionFilter } from './prisma-exceptions-filter';

import { AppModule } from './app.module';

type TrustProxyApp = {
  set(setting: 'trust proxy', value: number): void;
};

function getAllowedCorsOrigins() {
  const configuredOrigins = [process.env.WEB_ORIGIN].filter(
    Boolean,
  ) as string[];

  if (process.env.NODE_ENV === 'production') {
    return configuredOrigins;
  }

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...configuredOrigins,
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as TrustProxyApp;
  expressApp.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: {
        policy: 'no-referrer',
      },
    }),
  );
  app.enableCors({
    origin: getAllowedCorsOrigins(),
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new AppExceptionFilter(), new PrismaExceptionFilter());
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
