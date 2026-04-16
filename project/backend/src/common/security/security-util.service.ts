import { Injectable } from '@nestjs/common'

/**
 * 安全工具类
 * 提供各种安全相关的辅助方法
 */
@Injectable()
export class SecurityUtilService {
  /**
   * 生成安全的随机字符串
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const random = new Uint8Array(length)
    require('crypto').randomFillSync(random)
    return Array.from(random)
      .map((x) => chars[x % chars.length])
      .join('')
  }

  /**
   * 生成密码重置令牌
   */
  generateResetToken(): { token: string; hash: string; expiresAt: Date } {
    const token = this.generateSecureToken(48)
    const hash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1小时后过期

    return { token, hash, expiresAt }
  }

  /**
   * 验证邮箱格式
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 验证手机号格式
   */
  isValidPhone(phone: string, countryCode?: string): boolean {
    // 国际手机号格式
    const internationalRegex = /^\+[1-9]\d{6,14}$/
    // 中国手机号
    const chinaRegex = /^1[3-9]\d{9}$/
    // 泰国手机号
    const thaiRegex = /^0[6-9]\d{8}$/

    if (countryCode === 'CN') {
      return chinaRegex.test(phone)
    } else if (countryCode === 'TH') {
      return thaiRegex.test(phone)
    }

    return internationalRegex.test(phone) || chinaRegex.test(phone) || thaiRegex.test(phone)
  }

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): {
    valid: boolean
    score: number
    errors: string[]
  } {
    const errors: string[] = []
    let score = 0

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters')
    } else {
      score += 1
    }

    if (password.length >= 12) score += 1

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      errors.push('Password must contain lowercase letters')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      errors.push('Password must contain uppercase letters')
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      errors.push('Password must contain numbers')
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      errors.push('Password must contain special characters')
    }

    return {
      valid: errors.length === 0,
      score: Math.min(score, 5),
      errors,
    }
  }

  /**
   * 检查密码是否泄露
   * 使用 Have I Been Pwned API
   */
  async isPasswordLeaked(password: string): Promise<boolean> {
    try {
      const crypto = require('crypto')
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
      const prefix = sha1.substring(0, 5)
      const suffix = sha1.substring(5)

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      const text = await response.text()

      const hashes = text.split('\r\n')
      for (const hash of hashes) {
        const [hashSuffix, count] = hash.split(':')
        if (hashSuffix === suffix) {
          return parseInt(count, 10) > 0
        }
      }

      return false
    } catch {
      return false
    }
  }

  /**
   * 哈希邮箱用于不重复验证
   */
  hashEmail(email: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(email.toLowerCase().trim())
      .digest('hex')
  }

  /**
   * 获取请求的真实 IP
   */
  getRealIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim()
    }

    const realIp = req.headers['x-real-ip']
    if (typeof realIp === 'string') {
      return realIp.trim()
    }

    return req.ip || req.socket?.remoteAddress || 'unknown'
  }

  /**
   * 检查是否是可信的代理
   */
  isTrustedProxy(req: any): boolean {
    const trustedProxies = (process.env.TRUSTED_PROXIES || '127.0.0.1')
      .split(',')
      .map((ip) => ip.trim())

    const clientIp = this.getRealIp(req)
    return trustedProxies.includes(clientIp)
  }
}
