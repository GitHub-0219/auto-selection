import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * 获取当前登录用户
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    if (data) {
      return user?.[data]
    }

    return user
  },
)

/**
 * 获取请求 IP 地址
 */
export const RequestIp = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return request.ip || request.socket?.remoteAddress
})

/**
 * 获取请求 ID
 */
export const RequestId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.headers['x-request-id'] || request.id
})
