/**
 * Security Module — 统一安全模块
 */

import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { RateLimitInterceptor } from './rate-limit.interceptor';
import { AntiBotGuard } from './anti-bot.guard';
import { RequestSignatureInterceptor } from './request-signature.interceptor';
import { AccessLogInterceptor } from './access-log.interceptor';
import { LoggerService } from './logger.service';
import { DatabaseBackupCronService } from './database-backup.cron';

@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    LoggerService,
    DatabaseBackupCronService,
    { provide: APP_INTERCEPTOR, useClass: AccessLogInterceptor },
    { provide: 'RATE_LIMIT_INTERCEPTOR', useClass: RateLimitInterceptor },
    { provide: 'SIGNATURE_INTERCEPTOR', useClass: RequestSignatureInterceptor },
    { provide: APP_GUARD, useClass: AntiBotGuard },
  ],
  exports: [
    LoggerService, DatabaseBackupCronService,
    RateLimitInterceptor, AntiBotGuard,
    RequestSignatureInterceptor, AccessLogInterceptor,
  ],
})
export class SecurityModule {}
