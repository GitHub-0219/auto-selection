import { Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler'
import { Request } from 'express'

/**
 * 自定义限流守卫 - 支持特定路由的严格限流
 * 用于保护敏感接口如登录、注册等
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    request: Request,
  ): Promise<void> {
    throw new ThrottlerException(
      '操作过于频繁，请15分钟后再试',
    )
  }

  protected async getTracker(req: Request): Promise<string> {
    // 优先使用用户ID，其次使用IP
    const user = (req as any).user
    if (user?.id) {
      return `user:${user.id}`
    }
    // 获取真实IP（处理代理）
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return req.ip || req.socket.remoteAddress || 'unknown'
  }
}
