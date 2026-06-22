import { Module } from '@nestjs/common';
import { WasteCategoriesController } from './waste-categories.controller';
import { WasteCategoriesService } from './waste-categories.service';

@Module({
  controllers: [WasteCategoriesController],
  providers: [WasteCategoriesService],
  exports: [WasteCategoriesService],
})
export class WasteCategoriesModule {}
