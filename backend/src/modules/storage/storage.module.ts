import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { WasteImagesController } from './waste-images.controller';

@Module({
  controllers: [WasteImagesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
