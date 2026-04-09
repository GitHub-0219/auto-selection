import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as validator from 'validator'

/**
 * XSS 防护中间件
 * 过滤和清理用户输入，防止跨站脚本攻击
 */
@Injectable()
export class XssProtectionMiddleware implements NestMiddleware {
  // 危险的 HTML 标签和属性
  private readonly dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
    /<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi,
  ]

  use(req: Request, res: Response, next: NextFunction) {
    // 清理请求体中的 XSS
    if (req.body) {
      req.body = this.sanitizeObject(req.body)
    }

    // 清理查询参数
    if (req.query) {
      req.query = this.sanitizeObject(req.query) as any
    }

    // 清理 URL 参数
    if (req.params) {
      req.params = this.sanitizeObject(req.params)
    }

    next()
  }

  /**
   * 递归清理对象中的字符串
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item))
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {}
      for (const key of Object.keys(obj)) {
        sanitized[key] = this.sanitizeObject(obj[key])
      }
      return sanitized
    }

    return obj
  }

  /**
   * 清理字符串中的 XSS
   */
  private sanitizeString(input: string): string {
    let sanitized = input

    // 移除危险的 HTML 和 JavaScript 模式
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '')
    }

    // HTML 实体编码
    sanitized = validator.escape(sanitized)

    // 移除控制字符
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

    return sanitized
  }
}

/**
 * XSS 防护工具类
 */
export class XssSanitizer {
  /**
   * 清理 HTML 内容（允许部分标签）
   */
  static sanitizeHtml(input: string, allowedTags: string[] = ['p', 'br', 'b', 'i', 'em', 'strong']): string {
    let sanitized = input

    // 移除所有 HTML 标签（除非在白名单中）
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
    sanitized = sanitized.replace(tagPattern, (match, tag) => {
      return allowedTags.includes(tag.toLowerCase()) ? match : ''
    })

    // 清理属性中的 XSS
    const attrPattern = /\s([a-zA-Z]+)\s*=\s*["'][^"']*["']/gi
    sanitized = sanitized.replace(attrPattern, (match, attr) => {
      const safeAttrs = ['href', 'title', 'alt', 'class', 'id']
      if (safeAttrs.includes(attr.toLowerCase())) {
        // 对 href 进行额外验证
        if (attr.toLowerCase() === 'href') {
          return match.replace(/["'][^"']*["']/, (url) => {
            if (url.includes('javascript:') || url.includes('data:')) {
              return '""'
            }
            return url
          })
        }
        return match
      }
      return ''
    })

    // HTML 实体编码未转义的内容
    sanitized = validator.escape(sanitized)

    return sanitized
  }

  /**
   * 清理 URL
   */
  static sanitizeUrl(url: string): string {
    // 只允许 http, https, mailto 协议
    const parsed = validator.escape(url)

    if (!/^(https?|mailto):/i.test(parsed)) {
      return ''
    }

    return parsed
  }

  /**
   * 清理 CSS
   */
  static sanitizeCss(css: string): string {
    // 移除 expression, url 中的 javascript
    let sanitized = css.replace(/expression\s*\(/gi, '')
    sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*javascript:/gi, 'url(')

    // 只允许安全的 CSS 属性
    const safePattern = /^(background|color|font|display|visibility|opacity|border|margin|padding):/i
    sanitized = sanitized
      .split(';')
      .filter((rule) => safePattern.test(rule.trim()))
      .join(';')

    return sanitized
  }
}
