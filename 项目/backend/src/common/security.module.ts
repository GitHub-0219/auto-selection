import { Injectable, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { SecurityHeadersMiddleware } from './security/security-headers.middleware'
import { ApiSignatureMiddleware } from './security/api-signature.middleware'
import { XssProtectionMiddleware } from './security/xss-protection.middleware'
import { SqlInjectionProtectionMiddleware } from './security/sql-injection-protection.middleware'
import { EncryptionService } from './security/encryption.service'
import { AuditLogService } from './security/audit-log.service'
import { SecurityUtilService } from './security/security-util.service'
import { RolesGuard } from './guards/roles.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'

@Module({
  imports: [
    // 请求限流
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1分钟
        limit: 60,
      },
      {
        name: 'long',
        ttl: 3600000, // 1小时
        limit: 1000,
      },
    ]),
  ],
  providers: [
    // 全局守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // 安全服务
    EncryptionService,
    AuditLogService,
    SecurityUtilService,
  ],
  exports: [EncryptionService, AuditLogService, SecurityUtilService],
})
export class SecurityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        SecurityHeadersMiddleware,
        XssProtectionMiddleware,
        SqlInjectionProtectionMiddleware,
      )
      .forRoutes('*')
  }
}
