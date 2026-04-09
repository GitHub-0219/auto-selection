import { Injectable } from '@nestjs/common'
import * as crypto from 'crypto'

/**
 * 敏感数据加密工具类
 * 使用 AES-256-GCM 模式进行加密
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm'
  private readonly keyLength = 32 // 256 bits
  private readonly ivLength = 16 // 128 bits
  private readonly tagLength = 16 // 128 bits

  /**
   * 获取加密密钥
   * 实际生产环境中应从 KMS 获取
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
    // 确保密钥长度为 32 字节
    const hash = crypto.createHash('sha256').update(key).digest()
    return hash
  }

  /**
   * 加密敏感数据
   * @param plaintext 明文
   * @returns 加密后的数据（包含 iv, tag, encrypted）
   */
  encrypt(plaintext: string): EncryptedData {
    const key = this.getEncryptionKey()
    const iv = crypto.randomBytes(this.ivLength)

    const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    })

    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      version: 1,
    }
  }

  /**
   * 解密敏感数据
   * @param encryptedData 加密数据
   * @returns 解密后的明文
   */
  decrypt(encryptedData: EncryptedData): string {
    const key = this.getEncryptionKey()
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const tag = Buffer.from(encryptedData.tag, 'base64')
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64')

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.tagLength,
    })

    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * 加密敏感字段对象
   * @param data 包含敏感字段的对象
   * @param sensitiveFields 需要加密的字段名列表
   * @returns 加密后的对象
   */
  encryptFields<T extends Record<string, any>>(
    data: T,
    sensitiveFields: (keyof T)[],
  ): T {
    const result = { ...data }

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        const encrypted = this.encrypt(result[field] as string)
        ;(result as any)[field] = JSON.stringify(encrypted)
      }
    }

    return result
  }

  /**
   * 解密敏感字段对象
   * @param data 包含加密字段的对象
   * @param sensitiveFields 需要解密的字段名列表
   * @returns 解密后的对象
   */
  decryptFields<T extends Record<string, any>>(
    data: T,
    sensitiveFields: (keyof T)[],
  ): T {
    const result = { ...data }

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          const encryptedData: EncryptedData = JSON.parse(result[field] as string)
          ;(result as any)[field] = this.decrypt(encryptedData)
        } catch (e) {
          // 如果不是加密格式，保持原值
          console.warn(`Field ${String(field)} is not in encrypted format`)
        }
      }
    }

    return result
  }

  /**
   * 生成随机密钥
   * 用于生成新的加密密钥
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex')
  }

  /**
   * 生成密码哈希（用于密码哈希）
   * 使用 crypto.scrypt
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32)
    const saltStr = saltBuffer.toString('hex')

    const hash = crypto
      .scryptSync(password, saltBuffer, 64, {
        N: 2 ** 14,
        r: 8,
        p: 1,
      })
      .toString('hex')

    return { hash, salt: saltStr }
  }

  /**
   * 验证密码哈希
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt)
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'))
  }

  /**
   * 生成安全的随机令牌
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * 生成 HMAC 签名
   */
  createHmacSignature(data: string, secret?: string): string {
    const hmacSecret = secret || process.env.JWT_SECRET || 'default-secret'
    return crypto.createHmac('sha256', hmacSecret).update(data).digest('hex')
  }

  /**
   * 验证 HMAC 签名
   */
  verifyHmacSignature(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHmacSignature(data, secret)
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      )
    } catch {
      return false
    }
  }
}

/**
 * 加密数据结构
 */
export interface EncryptedData {
  encrypted: string // Base64 编码的密文
  iv: string // Base64 编码的初始化向量
  tag: string // Base64 编码的认证标签
  version: number // 密钥版本号
}
