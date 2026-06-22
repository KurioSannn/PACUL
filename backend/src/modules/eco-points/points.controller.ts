import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { PointsService } from './points.service';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('me')
  getMyPoints(@CurrentUser() user: AuthUser) {
    return this.pointsService.getPointsSummary(user.id);
  }

  @Get(':userId')
  getUserPoints(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.pointsService.getPointsSummary(userId);
  }
}
