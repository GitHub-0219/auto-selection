/**
 * Anti-Bot Guard — 反爬/防刷/防恶意请求
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

const DEFAULT_BLOCKED_UA = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /wget/i, /curl/i, /python-requests/i, /scrapy/i,
  /okhttp/i, /java\//i,
];

const DEFAULT_HONEYPOT_PATHS = [
  '/wp-login.php', '/.env', '/wp-config.php',
  '/.git', '/.svn', '/wp-admin',
  '/phpmyadmin', '/console', '/actuator',
];

const DEFAULT_MALICIOUS_PATHS = [
  /\.\.\//, /\/etc\//, /\/proc\//, /\.env$/, /\.git\//,
  /\.DS_Store/, /\.sql$/i, /\.bak$/i, /\.swp$/i,
  /\/admin\//i, /console\//i, /debug\//i, /actuator\//i, /config\//i,
];

@Injectable()
export class AntiBotGuard implements CanActivate {
  private blockedUa: RegExp[];
  private honeypotPaths: string[];
  private maliciousPatterns: RegExp[];
  private allowedOrigins: string[];

  constructor(config: {
    blockedUa?: RegExp[];
    allowedOrigins?: string[];
    honeypotPaths?: string[];
    maliciousPatterns?: RegExp[];
  } = {}) {
    this.blockedUa = config.blockedUa || DEFAULT_BLOCKED_UA;
    this.allowedOrigins = config.allowedOrigins || [];
    this.honeypotPaths = config.honeypotPaths || DEFAULT_HONEYPOT_PATHS;
    this.maliciousPatterns = config.maliciousPatterns || DEFAULT_MALICIOUS_PATHS;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url;
    const ua = (request.headers['user-agent'] || '').toLowerCase();
    const referer = request.headers.referer || '';
    const origin = request.headers.origin || '';

    // 1. Honeypot 陷阱
    if (this.honeypotPaths.some(p => path.toLowerCase().includes(p))) {
      throw new NotFoundException('Not Found');
    }

    // 2. UA 过滤
    if (!ua || ua === '-') {
      throw new ForbiddenException('缺少 User-Agent 头');
    }
    for (const pattern of this.blockedUa) {
      if (pattern.test(ua)) {
        throw new ForbiddenException('请求被拒绝');
      }
    }

    // 3. Referer 校验
    if (this.allowedOrigins.length > 0) {
      const url = referer || origin;
      if (url && !this.allowedOrigins.some(a => url.includes(a))) {
        throw new ForbiddenException('来源不受允许');
      }
    }

    // 4. 路径净化
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(path)) {
        throw new ForbiddenException('请求被拒绝');
      }
    }

    return true;
  }
}
