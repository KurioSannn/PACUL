import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { AddSourceListingsDto } from './dto/add-source-listings.dto';
import { CreateMaterialBatchDto } from './dto/create-material-batch.dto';
import {
  MaterialBatchFiltersDto,
  UpdateMaterialBatchDto,
} from './dto/update-material-batch.dto';
import { MaterialBatchService } from './material-batch.service';

@Controller('collector/material-batches')
@Roles('collector')
export class MaterialBatchController {
  constructor(private readonly materialBatchService: MaterialBatchService) {}

  @Post()
  createBatch(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMaterialBatchDto,
  ) {
    return this.materialBatchService.createBatch(user.id, dto);
  }

  @Get()
  listCollectorBatches(
    @CurrentUser() user: AuthUser,
    @Query() filters: MaterialBatchFiltersDto,
  ) {
    return this.materialBatchService.listCollectorBatches(
      user.id,
      filters.status,
    );
  }

  @Get(':id')
  getBatch(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.materialBatchService.getBatch(id, user.id);
  }

  @Patch(':id')
  updateBatch(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialBatchDto,
  ) {
    return this.materialBatchService.updateBatch(id, user.id, dto);
  }

  @Post(':id/sources')
  addSourceListings(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSourceListingsDto,
  ) {
    return this.materialBatchService.addSourceListings(id, user.id, dto);
  }

  @Post(':id/sorting-complete')
  markSortingComplete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.materialBatchService.markSortingComplete(id, user.id);
  }

  @Post(':id/publish')
  publishBatch(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.materialBatchService.publishBatch(id, user.id);
  }

  @Post(':id/unavailable')
  markBatchUnavailable(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.materialBatchService.markBatchUnavailable(id, user.id);
  }
}
