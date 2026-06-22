import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { StorageService } from '../../src/modules/storage/storage.service';

config({ path: resolve(process.cwd(), '.env') });

export async function setupStorage(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const storageService = app.get(StorageService);
    const result = await storageService.initBuckets();

    console.log('Storage buckets initialized:', result);
    console.log(
      `  waste-images: ${result.wasteImages} (private, 5MB, jpeg/png/webp)`,
    );
    console.log(`  reports: ${result.reports} (private, 20MB)`);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  setupStorage()
    .then(() => {
      console.log('Storage setup completed successfully.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Storage setup failed:', message);
      process.exit(1);
    });
}
