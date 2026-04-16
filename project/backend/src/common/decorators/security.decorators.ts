import { SetMetadata } from '@nestjs/common'

/**
 * 角色守卫元数据
 */
export const ROLES_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

/**
 * 公开接口元数据（不需要认证）
 */
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/**
 * 需要审计的接口
 */
export const AUDIT_KEY = 'audit'
export const Auditable = (action: string) => SetMetadata(AUDIT_KEY, action)
