import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { CommitRouteDto } from './dto/commit-route.dto';
import { RoutePreviewDto } from './dto/route-preview.dto';
import { UpdateRouteStatusDto } from './dto/update-route-status.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { RouteService } from './route.service';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routeService: RouteService) {}

  @Post('preview')
  @Roles('collector')
  previewRoute(@CurrentUser() user: AuthUser, @Body() dto: RoutePreviewDto) {
    return this.routeService.previewRoute(user.id, dto.listingIds);
  }

  @Post()
  @Roles('collector')
  commitRoute(@CurrentUser() user: AuthUser, @Body() dto: CommitRouteDto) {
    return this.routeService.commitRoute(user.id, dto.listingIds, dto.notes);
  }

  @Get(':id')
  @Roles('collector', 'household')
  getRouteById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routeService.getRouteById(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles('collector')
  updateRouteStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteStatusDto,
  ) {
    return this.routeService.updateRouteStatus(
      id,
      user.id,
      dto.status,
      dto.cancel_reason,
    );
  }

  @Patch(':id/stops/:stopId/status')
  @Roles('collector')
  updateStopStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: UpdateStopStatusDto,
  ) {
    return this.routeService.updateStopStatus(
      id,
      stopId,
      user.id,
      dto.status,
      dto.notes,
    );
  }

  @Post(':id/recalculate')
  @Roles('collector')
  recalculateRoute(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routeService.recalculateRoute(id, user.id);
  }
}
