import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

/**
 * 安全响应头中间件
 * 设置各种安全相关的 HTTP 响应头
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const env = process.env.NODE_ENV || 'development'

    // 基础安全头
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('X-Download-Options', 'noopen')
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')

    // 引用策略
    res.setHeader(
      'Referrer-Policy',
      env === 'production' ? 'strict-origin-when-cross-origin' : 'no-referrer',
    )

    // 内容安全策略
    if (env === 'production') {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.example.com",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
        ]
          .filter(Boolean)
          .join('; '),
      )
    }

    // 跨域资源共享
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
    const origin = req.headers.origin

    if (origin && allowedOrigins.some((o) => o.trim() === origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-API-Signature, X-API-Timestamp, X-API-Nonce',
      )
      res.setHeader('Access-Control-Max-Age', '86400') // 24小时
    }

    // SameSite Cookie
    res.setHeader(
      'Set-Cookie',
      `SameSite=${env === 'production' ? 'Strict' : 'Lax'}; Secure; HttpOnly`,
    )

    // 禁用缓存（敏感数据）
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // HSTS（在生产环境通过 HTTPS 时）
    if (env === 'production' && req.protocol === 'https') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      )
    }

    // 自定义安全头
    res.setHeader('X-Security-Version', '1.0')

    next()
  }
}
