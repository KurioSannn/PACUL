import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { AuditService } from './audit.service';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
@Roles('household', 'collector', 'industry')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  listNotifications(
    @CurrentUser() user: AuthUser,
    @Query() filters: NotificationFiltersDto,
  ) {
    return this.notificationService.listNotifications(user.id, {
      isRead: filters.is_read,
      limit: filters.limit,
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.markAsRead(id, user.id);
  }
}

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('audit-logs')
@Roles('household', 'collector', 'industry')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit log entries for the current user' })
  listOwnAuditLogs(@CurrentUser() user: AuthUser) {
    return this.auditService.listOwnLogs(user.id);
  }
}
