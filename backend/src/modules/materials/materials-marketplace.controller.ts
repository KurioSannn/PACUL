import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { MaterialMarketplaceFiltersDto } from './dto/material-marketplace-filters.dto';
import { MaterialBatchService } from './material-batch.service';

@Controller('materials')
@Roles('industry', 'collector')
export class MaterialsMarketplaceController {
  constructor(private readonly materialBatchService: MaterialBatchService) {}

  @Get()
  getAvailableMaterials(@Query() filters: MaterialMarketplaceFiltersDto) {
    return this.materialBatchService.getAvailableMaterials(filters);
  }

  @Get(':id')
  getAvailableMaterialById(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialBatchService.getAvailableMaterialById(id);
  }
}
