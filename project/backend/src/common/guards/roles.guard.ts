import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, IS_PUBLIC_KEY } from '../decorators/security.decorators'

/**
 * 角色守卫
 * 检查用户是否具有访问资源所需的角色
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 如果没有定义角色要求，则允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // 检查是否为公开接口
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.role) {
      return false
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return true
    }

    // 检查用户角色是否匹配要求
    return requiredRoles.includes(user.role)
  }
}
