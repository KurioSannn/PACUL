import { Global, Module } from '@nestjs/common';
import { SupabaseModule } from '../../supabase/supabase.module';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import {
  AuditLogsController,
  NotificationsController,
} from './notifications.controller';

@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [NotificationsController, AuditLogsController],
  providers: [AuditService, NotificationService],
  exports: [AuditService, NotificationService],
})
export class NotificationsModule {}
