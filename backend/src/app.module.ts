import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import type { EnvironmentVariables } from './common/config/env.validation';
import { validateEnv } from './common/config/env.validation';
import { THROTTLE_LIMITS, THROTTLE_TTL } from './common/config/throttle.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { AiModule } from './modules/ai/ai.module';
import { CollectorModule } from './modules/collector/collector.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { NegotiationModule } from './modules/negotiation/negotiation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PickupModule } from './modules/pickup/pickup.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TraceabilityModule } from './modules/traceability/traceability.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { StorageModule } from './modules/storage/storage.module';
import { WasteCategoriesModule } from './modules/waste-categories/waste-categories.module';
import { WasteListingsModule } from './modules/waste-listings/waste-listings.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => [
        {
          name: 'default',
          ttl: THROTTLE_TTL.oneMinuteMs,
          limit:
            configService.get('RATE_LIMIT_GLOBAL_PER_MINUTE', {
              infer: true,
            }) ?? THROTTLE_LIMITS.globalPerMinute,
        },
      ],
    }),
    SupabaseModule,
    TraceabilityModule,
    AuthModule,
    AiModule,
    ProfilesModule,
    StorageModule,
    CollectorModule,
    DashboardModule,
    MaterialsModule,
    NegotiationModule,
    NotificationsModule,
    OrdersModule,
    PickupModule,
    RatingsModule,
    RealtimeModule,
    ReportsModule,
    RoutesModule,
    TransactionsModule,
    WasteCategoriesModule,
    WasteListingsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
