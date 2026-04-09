import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

/**
 * SQL 注入防护中间件
 * 基于 Prisma ORM 的参数化查询，理论上已防止 SQL 注入
 * 此中间件提供额外的检查和日志
 */
@Injectable()
export class SqlInjectionProtectionMiddleware implements NestMiddleware {
  // 常见的 SQL 注入模式
  private readonly suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b.*){2,}/i,
    /('|(\\')|(--)|(\#)|(\/\*)|(\*\/)|(\|))/i,
    /\bOR\b\s+\d+\s*=\s*\d+/i,
    /\bAND\b\s+\d+\s*=\s*\d+/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bEXEC\b.*\bSP_\b)/i,
    /(\bXP_\b)/i,
    /(\bLOAD_FILE\b)/i,
    /(\bINTO\s+(OUTFILE|DUMPFILE)\b)/i,
    /(\bSLEEP\b\s*\()/i,
    /(\bBENCHMARK\b\s*\()/i,
    /(\bWAITFOR\s+DELAY\b)/i,
  ]

  use(req: Request, res: Response, next: NextFunction) {
    const suspicious = this.checkRequest(req)

    if (suspicious) {
      // 记录可疑请求
      console.warn('Suspicious SQL-like pattern detected:', {
        path: req.path,
        method: req.method,
        ip: this.getClientIp(req),
        pattern: suspicious,
      })

      // 生产环境直接拒绝
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          code: 'INVALID_REQUEST',
          message: 'Invalid request format',
        })
      }
    }

    next()
  }

  private checkRequest(req: Request): string | null {
    // 检查请求体
    if (req.body) {
      const bodyStr = JSON.stringify(req.body)
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(bodyStr)) {
          return `body: ${pattern.toString()}`
        }
      }
    }

    // 检查查询参数
    if (req.query) {
      const queryStr = JSON.stringify(req.query)
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(queryStr)) {
          return `query: ${pattern.toString()}`
        }
      }
    }

    return null
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }
    return req.ip || req.socket.remoteAddress || 'unknown'
  }
}

/**
 * SQL 注入防护工具类
 */
export class SqlInjectionProtector {
  /**
   * 检查字符串是否包含可疑的 SQL 模式
   */
  static containsSuspiciousPattern(input: string): boolean {
    const patterns = [
      /('|(\\')|(--)|(\#)|(\/\*)|(\*\/)|(\|))/,
      /\bOR\b\s+\d+\s*=\s*\d+/i,
      /\bAND\b\s+\d+\s*=\s*\d+/i,
    ]

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return true
      }
    }

    return false
  }

  /**
   * 清理可能用于 SQL 注入的特殊字符
   * 注意：这只是一种额外的防护，Prisma 的参数化查询已足够安全
   */
  static escapeForLogging(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x00/g, '\\0')
  }
}
