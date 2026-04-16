import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

/**
 * 简单图形验证码服务
 * 基于SVG生成，可扩展为Canvas/第三方验证码
 */
@Injectable()
export class CaptchaService {
  private captchaCache: Map<string, { code: string; expiresAt: number }> = new Map()
  private readonly codeLength: number
  private readonly expirySeconds: number

  constructor(private configService: ConfigService) {
    this.codeLength = this.configService.get<number>('CAPTCHA_CODE_LENGTH') || 4
    this.expirySeconds = this.configService.get<number>('CAPTCHA_EXPIRY') || 300 // 5分钟
  }

  /**
   * 生成验证码
   * @returns 验证码ID（token）和SVG图片
   */
  generate(): { token: string; svg: string } {
    const code = this.generateCode()
    const token = this.generateToken()
    const expiresAt = Date.now() + this.expirySeconds * 1000

    this.captchaCache.set(token, { code, expiresAt })

    const svg = this.generateSvg(code)

    return { token, svg }
  }

  /**
   * 验证验证码
   * @param token 验证码ID
   * @param userInput 用户输入的验证码
   * @returns 是否验证通过
   */
  verify(token: string, userInput: string): boolean {
    const captcha = this.captchaCache.get(token)

    if (!captcha) {
      return false
    }

    if (Date.now() > captcha.expiresAt) {
      this.captchaCache.delete(token)
      return false
    }

    // 不区分大小写
    const isValid = captcha.code.toLowerCase() === userInput.toLowerCase()
    
    // 验证成功后删除（一次性）
    if (isValid) {
      this.captchaCache.delete(token)
    }

    return isValid
  }

  /**
   * 删除验证码（可选，用于手动失效）
   */
  invalidate(token: string): void {
    this.captchaCache.delete(token)
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < this.codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * 生成SVG验证码图片
   */
  private generateSvg(code: string): string {
    const width = 120
    const height = 40
    const fontSize = 24

    // 随机扭曲字符
    const chars = code.split('').map((char, i) => {
      const x = 20 + i * 25
      const y = 28 + (Math.random() - 0.5) * 10
      const rotate = (Math.random() - 0.5) * 30
      return `<text x="${x}" y="${y}" 
        transform="rotate(${rotate} ${x} ${y})" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        fill="#333">${this.escapeXml(char)}</text>`
    })

    // 干扰线
    const lines = Array.from({ length: 3 }, () => {
      const x1 = Math.random() * width
      const y1 = Math.random() * height
      const x2 = Math.random() * width
      const y2 = Math.random() * height
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ddd" stroke-width="1"/>`
    }).join('')

    // 噪点
    const dots = Array.from({ length: 10 }, () => {
      const x = Math.random() * width
      const y = Math.random() * height
      return `<circle cx="${x}" cy="${y}" r="1" fill="#ccc"/>`
    }).join('')

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#f5f5f5"/>
      ${lines}
      ${dots}
      ${chars.join('')}
    </svg>`
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
