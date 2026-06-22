require('reflect-metadata');

process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ??= 'openapi-gen-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'openapi-gen-service-role-key';
process.env.SUPABASE_JWT_SECRET ??= 'openapi-gen-jwt-secret';

const { mkdirSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const { ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { stringify } = require('yaml');

const { AppModule } = require('../dist/src/app.module');
const { buildSwaggerDocument } = require('../dist/src/common/swagger/swagger.config');

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );

  await app.init();

  const document = buildSwaggerDocument(app);
  const outputPath = join(__dirname, '..', '..', 'docs', 'openapi.yaml');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, stringify(document), 'utf8');

  await app.close();

  console.log(`OpenAPI spec written to ${outputPath}`);
}

generateOpenApiSpec().catch((error) => {
  console.error('Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
