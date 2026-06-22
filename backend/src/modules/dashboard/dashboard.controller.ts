import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { DashboardService } from './dashboard.service';
import type {
  DashboardImpactFilters,
  DashboardSummary,
  MaterialFlow,
  PlatformImpact,
  RouteStats,
} from './dashboard.types';
import { DashboardImpactFiltersDto } from './dto/dashboard-impact-filters.dto';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Header('Cache-Control', 'max-age=60')
  @ApiOperation({ summary: 'Get role-specific dashboard summary metrics' })
  getSummary(@CurrentUser() user: AuthUser): Promise<DashboardSummary> {
    switch (user.role) {
      case 'household':
        return this.dashboardService.getHouseholdSummary(user.id);
      case 'collector':
        return this.dashboardService.getCollectorSummary(user.id);
      case 'industry':
        return this.dashboardService.getIndustrySummary(user.id);
    }
  }

  @Get('impact')
  @Header('Cache-Control', 'max-age=60')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({
    summary: 'Get platform-wide impact metrics with optional filters',
  })
  getPlatformImpact(
    @Query() query: DashboardImpactFiltersDto,
  ): Promise<PlatformImpact> {
    return this.dashboardService.getPlatformImpact(mapImpactFilters(query));
  }

  @Get('material-flow')
  @Header('Cache-Control', 'max-age=60')
  @Roles('household', 'collector', 'industry')
  @ApiOperation({
    summary: 'Get material flow breakdown by category and region',
  })
  getMaterialFlow(
    @Query() query: DashboardImpactFiltersDto,
  ): Promise<MaterialFlow> {
    return this.dashboardService.getMaterialFlow(mapImpactFilters(query));
  }

  @Get('routes')
  @Header('Cache-Control', 'max-age=60')
  @Roles('collector')
  @ApiOperation({ summary: 'Get pickup route statistics for the collector' })
  getRouteStats(@CurrentUser() user: AuthUser): Promise<RouteStats> {
    return this.dashboardService.getRouteStats(user.id);
  }
}

function mapImpactFilters(
  query: DashboardImpactFiltersDto,
): DashboardImpactFilters {
  return {
    from_date: query.from,
    to_date: query.to,
    city: query.city,
    province: query.province,
  };
}
