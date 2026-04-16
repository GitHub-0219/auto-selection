/**
 * 数据脱敏工具类
 * 用于在日志、响应等场景中对敏感数据进行脱敏处理
 */

export class DataMaskingService {
  /**
   * 手机号脱敏: 138****5678
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  /**
   * 邮箱脱敏: t***@example.com
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email
    const [name, domain] = email.split('@')
    if (!name || !domain) return email
    return `${name[0]}***@${domain}`
  }

  /**
   * 身份证脱敏: 110***1234
   */
  static maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 14) return idCard
    return idCard.replace(/(\d{3})\d{11}(\d{4})/, '$1***$2')
  }

  /**
   * 银行卡脱敏: **** **** **** 1234
   */
  static maskBankCard(bankCard: string): string {
    if (!bankCard || bankCard.length < 4) return bankCard
    const last4 = bankCard.slice(-4)
    return `**** **** **** ${last4}`
  }

  /**
   * 姓名脱敏: 张*三
   */
  static maskName(name: string): string {
    if (!name || name.length < 2) return name
    if (name.length === 2) return `${name[0]}*`
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
  }

  /**
   * 地址脱敏: 只显示省市
   */
  static maskAddress(address: string): string {
    if (!address) return address
    // 只保留前6个字符 + ***
    if (address.length <= 6) return address
    return `${address.substring(0, 6)}***`
  }

  /**
   * IP地址脱敏: 192.168.***.***
   */
  static maskIp(ip: string): string {
    if (!ip) return ip
    const parts = ip.split('.')
    if (parts.length !== 4) return ip
    return `${parts[0]}.${parts[1]}.***.***`
  }

  /**
   * 密码脱敏: 返回固定长度星号
   */
  static maskPassword(password: string): string {
    return '********'
  }

  /**
   * API密钥脱敏: sk-***abc123***xyz
   */
  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 10) return '***'
    const prefix = apiKey.substring(0, 3)
    const suffix = apiKey.substring(apiKey.length - 3)
    return `${prefix}***${suffix}`
  }

  /**
   * 对象中所有敏感字段脱敏
   */
  static maskObject<T extends Record<string, any>>(
    obj: T,
    fieldsToMask: (keyof T)[],
  ): T {
    const result = { ...obj }

    for (const field of fieldsToMask) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = result[field]
        if (typeof value === 'string') {
          // 根据字段名选择脱敏方式
          const fieldName = String(field).toLowerCase()
          if (fieldName.includes('phone') || fieldName.includes('mobile')) {
            ;(result as any)[field] = this.maskPhone(value)
          } else if (fieldName.includes('email')) {
            ;(result as any)[field] = this.maskEmail(value)
          } else if (fieldName.includes('idcard') || fieldName.includes('id_card')) {
            ;(result as any)[field] = this.maskIdCard(value)
          } else if (
            fieldName.includes('bank') ||
            fieldName.includes('card')
          ) {
            ;(result as any)[field] = this.maskBankCard(value)
          } else if (fieldName.includes('name') && !fieldName.includes('username')) {
            ;(result as any)[field] = this.maskName(value)
          } else if (fieldName.includes('address')) {
            ;(result as any)[field] = this.maskAddress(value)
          } else if (fieldName === 'password' || fieldName.includes('password')) {
            ;(result as any)[field] = this.maskPassword(value)
          } else if (fieldName.includes('apikey') || fieldName.includes('api_key')) {
            ;(result as any)[field] = this.maskApiKey(value)
          } else if (fieldName.includes('ip')) {
            ;(result as any)[field] = this.maskIp(value)
          }
        }
      }
    }

    return result
  }

  /**
   * 递归脱敏对象中的所有字符串字段
   * 支持嵌套对象和数组
   */
  static deepMaskSensitive(obj: any, depth: number = 0): any {
    if (depth > 10) return '[MAX_DEPTH]'

    if (obj === null || obj === undefined) return obj

    if (typeof obj === 'string') return obj

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepMaskSensitive(item, depth + 1))
    }

    if (typeof obj === 'object') {
      const masked = this.maskObject(obj, Object.keys(obj) as any)
      const result: Record<string, any> = {}

      for (const key of Object.keys(masked)) {
        result[key] = this.deepMaskSensitive(masked[key], depth + 1)
      }

      return result
    }

    return obj
  }
}

/**
 * 默认需要脱敏的字段
 */
export const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'phone',
  'mobile',
  'email',
  'idCard',
  'id_card',
  'bankCard',
  'bank_card',
  'name',
  'realName',
  'real_name',
  'address',
  'apiKey',
  'api_key',
  'secret',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
]
