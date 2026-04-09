import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'

// [BUG-008 FIX] 根据环境配置日志级别
const isProduction = process.env.NODE_ENV === 'production'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // [BUG-008 FIX] 生产环境限制日志级别
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  // [BUG-005 FIX] 添加API版本前缀
  app.setGlobalPrefix('api/v1')

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // [BUG-006 FIX] 移除X-Powered-By响应头
  app.use((req: any, res: any, next: any) => {
    res.removeHeader('X-Powered-By')
    res.removeHeader('X-Response-Time')
    next()
  })

  // 安全响应头
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })

  // CORS配置
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`🚀 Backend running on http://localhost:${port}`)
  console.log(`📌 API Version: v1`)
  console.log(`🔒 Security headers enabled`)
}

bootstrap()
