import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { InjectRedis } from './redis-inject.decorator'

/**
 * 请求限流中间件
 * 支持多种限流策略
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    @InjectRedis() private redis: any,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req)
    const path = req.path
    const userId = (req as any).user?.id || 'anonymous'

    // 不同端点的限流配置
    const limits = this.getRateLimits(req.path)

    for (const limit of limits) {
      const key = `ratelimit:${limit.key}:${limit.getKey(ip, path, userId)}`
      const result = await this.checkRateLimit(key, limit)

      // 设置限流响应头
      res.setHeader('X-RateLimit-Limit', limit.maxRequests)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', result.resetTime)

      if (!result.allowed) {
        return res.status(429).json({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: result.retryAfter,
        })
      }
    }

    next()
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return req.ip || req.socket.remoteAddress || 'unknown'
  }

  private getRateLimits(path: string): RateLimitConfig[] {
    const baseLimits: RateLimitConfig[] = [
      {
        key: 'global',
        windowMs: 60 * 1000, // 1分钟
        maxRequests: 100,
        getKey: (ip) => ip,
      },
      {
        key: 'auth',
        windowMs: 15 * 60 * 1000, // 15分钟
        maxRequests: 5,
        getKey: (ip) => `auth:${ip}`,
        paths: ['/api/auth/login', '/api/auth/register'],
      },
      {
        key: 'api',
        windowMs: 60 * 1000, // 1分钟
        maxRequests: 60,
        getKey: (_, __, userId) => userId,
      },
      {
        key: 'ai',
        windowMs: 60 * 1000, // 1分钟
        maxRequests: 30,
        getKey: (_, __, userId) => `ai:${userId}`,
        paths: ['/api/ai/'],
      },
    ]

    return baseLimits.filter((limit) => {
      if (!limit.paths) return true
      return limit.paths.some((p) => path.startsWith(p))
    })
  }

  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - config.windowMs

    try {
      // 使用 Redis 有序集合实现滑动窗口限流
      const multi = this.redis.multi()

      // 删除窗口外的记录
      multi.zremrangebyscore(key, 0, windowStart)

      // 添加当前请求
      multi.zadd(key, now.toString(), `${now}-${Math.random()}`)

      // 获取窗口内请求数
      multi.zcard(key)

      // 设置过期时间
      multi.pexpire(key, config.windowMs)

      const results = await multi.exec()
      const requestCount = results[2][1] as number

      const remaining = Math.max(0, config.maxRequests - requestCount)
      const allowed = requestCount <= config.maxRequests

      // 计算重置时间
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTime = oldestRequest.length > 1 ? parseInt(oldestRequest[1], 10) : now
      const resetTime = Math.ceil((oldestTime + config.windowMs) / 1000)
      const retryAfter = allowed ? 0 : Math.ceil((oldestTime + config.windowMs - now) / 1000)

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter,
      }
    } catch (error) {
      // Redis 不可用时，放过请求但记录日志
      console.error('Rate limit check failed:', error)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Math.ceil((now + config.windowMs) / 1000),
        retryAfter: 0,
      }
    }
  }
}

interface RateLimitConfig {
  key: string
  windowMs: number
  maxRequests: number
  getKey: (ip: string, path: string, userId: string) => string
  paths?: string[]
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter: number
}
