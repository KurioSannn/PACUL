import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';

import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';

import { parseCorsAllowedOrigins } from './common/config/cors.config';
import { setupSwagger } from './common/swagger/swagger.config';

function applySecurityHeaders(
  _req: Request,

  res: Response,

  next: NextFunction,
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('X-Frame-Options', 'DENY');

  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = parseCorsAllowedOrigins(
    process.env.CORS_ALLOWED_ORIGINS,
  );

  app.enableCors({
    origin: (
      origin: string | undefined,

      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);

        return;
      }

      callback(new Error(`Origin '${origin}' is not allowed by CORS`), false);
    },

    credentials: true,
  });

  app.use(applySecurityHeaders);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,

      transformOptions: { enableImplicitConversion: true },

      forbidUnknownValues: true,
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT ?? 4000;

  await app.listen(port);
}

void bootstrap();
