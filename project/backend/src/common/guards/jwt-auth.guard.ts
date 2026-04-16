import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/security.decorators'

/**
 * JWT 认证守卫
 * 验证用户是否已登录
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 公开接口不需要认证
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }

    // JWT 验证由 Passport JwtStrategy 处理
    // 这里只检查是否存在 token
    return true
  }
}
