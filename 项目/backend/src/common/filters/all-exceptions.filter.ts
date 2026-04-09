import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { DataMaskingService } from './security/data-masking.service'

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回安全的错误信息
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // 记录错误日志（敏感数据脱敏）
    this.logError(exception, request)

    // 处理不同类型的异常
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_ERROR'
    let details: any = undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any
        message = resp.message || message
        code = resp.code || this.getCodeFromStatus(status)
        details = resp.details
      }
    } else if (exception instanceof Error) {
      message = this.getSafeErrorMessage(exception, request)
    }

    // 构建错误响应
    const errorResponse = {
      code,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'],
    }

    // 开发环境添加详细信息
    if (process.env.NODE_ENV !== 'production') {
      ;(errorResponse as any).details = details
      ;(errorResponse as any).stack = exception instanceof Error ? exception.stack : undefined
    }

    response.status(status).json(errorResponse)
  }

  private logError(exception: unknown, request: Request) {
    const logData = {
      method: request.method,
      url: request.url,
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id,
      error: exception instanceof Error ? exception.message : String(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    }

    // 敏感数据脱敏
    const maskedLog = DataMaskingService.deepMaskSensitive(logData)

    console.error('Error occurred:', maskedLog)
  }

  private getSafeErrorMessage(exception: Error, request: Request): string {
    const path = request.path

    // 根据错误类型返回安全的错误消息
    if (exception.message.includes('Prisma')) {
      return 'Database operation failed'
    }

    if (exception.message.includes('Validation')) {
      return 'Validation failed'
    }

    if (exception.message.includes('Unauthorized')) {
      return 'Authentication required'
    }

    if (exception.message.includes('Forbidden')) {
      return 'Access denied'
    }

    // 默认错误消息
    return 'An error occurred while processing your request'
  }

  private getCodeFromStatus(status: number): string {
    const statusCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    }

    return statusCodes[status] || 'ERROR'
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return request.ip || request.socket?.remoteAddress || 'unknown'
  }
}
