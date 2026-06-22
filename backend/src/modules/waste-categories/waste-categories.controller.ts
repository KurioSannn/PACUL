import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { WasteCategoriesService } from './waste-categories.service';

@Controller('waste-categories')
export class WasteCategoriesController {
  constructor(
    private readonly wasteCategoriesService: WasteCategoriesService,
  ) {}

  @Public()
  @Get()
  listActiveCategories() {
    return this.wasteCategoriesService.listActiveCategories();
  }
}
