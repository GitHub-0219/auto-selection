import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { UserModule } from './modules/user/user.module'
import { ProductModule } from './modules/product/product.module'
import { OrderModule } from './modules/order/order.module'
import { AIModule } from './modules/ai/ai.module'
import { CaptchaModule } from './modules/captcha/captcha.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 限流保护配置
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1分钟窗口
      limit: 100,   // 默认100次请求
    }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET')
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required')
        }
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '7d' },
        }
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    UserModule,
    ProductModule,
    OrderModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
