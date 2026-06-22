import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('PACUL Backend API')
    .setDescription(
      'REST API for the PACUL circular waste marketplace (hackathon MVP).',
    )
    .setVersion('1.0.0-hackathon')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase access token from sign-in',
      },
      'bearer',
    )
    .addServer('http://localhost:4000', 'Local development')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  const document = buildSwaggerDocument(app);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
