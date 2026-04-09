import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'

/**
 * API签名验证中间件
 * 防止请求篡改和重放攻击
 */
@Injectable()
export class ApiSignatureMiddleware implements NestMiddleware {
  private readonly timestampTolerance = 5 * 60 * 1000 // 5分钟

  use(req: Request, res: Response, next: NextFunction) {
    // 仅对 POST/PUT/PATCH 请求进行签名验证
    if (['GET', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next()
    }

    const signature = req.headers['x-api-signature'] as string
    const timestamp = req.headers['x-api-timestamp'] as string
    const nonce = req.headers['x-api-nonce'] as string

    // 生产环境必须验证签名
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !timestamp || !nonce) {
        return res.status(401).json({
          code: 'MISSING_SIGNATURE',
          message: 'Missing required signature headers',
        })
      }

      // 验证时间戳
      const requestTime = parseInt(timestamp, 10)
      const now = Date.now()
      if (isNaN(requestTime) || Math.abs(now - requestTime) > this.timestampTolerance) {
        return res.status(401).json({
          code: 'EXPIRED_REQUEST',
          message: 'Request timestamp is expired',
        })
      }

      // 验证签名
      const isValid = this.verifySignature(req, signature, timestamp, nonce)
      if (!isValid) {
        return res.status(401).json({
          code: 'INVALID_SIGNATURE',
          message: 'Invalid request signature',
        })
      }
    }

    // 存储nonce用于后续防重放检查
    ;(req as any).apiNonce = nonce
    ;(req as any).apiTimestamp = timestamp

    next()
  }

  /**
   * 验证请求签名
   */
  private verifySignature(
    req: Request,
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    const secret = process.env.API_SIGNATURE_SECRET || process.env.JWT_SECRET
    if (!secret) {
      console.warn('API_SIGNATURE_SECRET not configured, skipping signature verification')
      return true
    }

    // 构建签名串
    const stringToSign = this.buildStringToSign(req, timestamp, nonce)

    // 计算期望的签名
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex')

    // 使用 timingSafeEqual 防止时序攻击
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      )
    } catch {
      return false
    }
  }

  /**
   * 构建签名串
   * Format: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
   */
  private buildStringToSign(
    req: Request,
    timestamp: string,
    nonce: string,
  ): string {
    const method = req.method.toUpperCase()
    const path = req.originalUrl || req.url
    const body = req.body ? JSON.stringify(req.body) : ''
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')

    return `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`
  }
}

/**
 * API签名工具类
 * 供客户端使用
 */
export class ApiSignatureUtil {
  /**
   * 生成API签名
   */
  static generateSignature(
    method: string,
    path: string,
    body: object | null,
    timestamp: number,
    nonce: string,
    secret: string,
  ): string {
    const bodyStr = body ? JSON.stringify(body) : ''
    const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
    const stringToSign = `${method.toUpperCase()}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`

    return crypto.createHmac('sha256', secret).update(stringToSign).digest('hex')
  }

  /**
   * 生成请求头
   */
  static generateHeaders(
    method: string,
    path: string,
    body: object | null,
    secret: string,
  ): Record<string, string> {
    const timestamp = Date.now()
    const nonce = crypto.randomUUID()

    return {
      'X-API-Timestamp': timestamp.toString(),
      'X-API-Nonce': nonce,
      'X-API-Signature': this.generateSignature(method, path, body, timestamp, nonce, secret),
    }
  }
}
