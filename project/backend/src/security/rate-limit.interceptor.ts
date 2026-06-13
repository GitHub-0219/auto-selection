/**
 * Rate Limit Interceptor — NestJS 滑动窗口限流
 * 
 * 功能：
 * 1. 基于 IP + 端点的滑动窗口限流
 * 2. 自动封禁：触发限流多次后封禁 IP
 * 3. 响应头：RateLimit-Limit, RateLimit-Remaining, Retry-After
 * 4. 健康检查等端点自动跳过
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  whitelistPaths?: string[];
  autoBanThreshold?: number;
  autoBanDuration?: number;
}

interface RateLimitBucket {
  windowStart: number;
  count: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: '请求过于频繁，请稍后再试',
  whitelistPaths: ['/health', '/healthcheck', '/api/v1/health'],
  autoBanThreshold: 10,
  autoBanDuration: 30 * 60 * 1000,
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private config: RateLimitConfig;
  private store = new Map<string, RateLimitBucket[]>();
  private banList = new Map<string, number>();
  private abuseTracker = new Map<string, number>();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private get ip(): string {
    const ctx = this.getContext();
    const forwarded = ctx?.getRequest().headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return ctx?.getRequest().ip || 'unknown';
  }

  private getContext() {
    // accessed via intercept method scope
    return null as unknown as ExecutionContext;
  }

  private isBanned(ip: string): boolean {
    const banUntil = this.banList.get(ip);
    if (banUntil && Date.now() < banUntil) return true;
    if (banUntil) this.banList.delete(ip);
    return false;
  }

  private banIp(ip: string, duration: number) {
    this.banList.set(ip, Date.now() + duration);
    this.abuseTracker.delete(ip);
  }

  private recordAbuse(ip: string, threshold: number): boolean {
    const count = (this.abuseTracker.get(ip) || 0) + 1;
    this.abuseTracker.set(ip, count);
    if (count >= threshold) {
      this.abuseTracker.delete(ip);
      return true;
    }
    return false;
}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const path = request.path;

    const ip = this.ip;

    // 检查封禁
    if (this.isBanned(ip)) {
      return throwError(() => {
        const error = new Error('IP被临时封禁，请稍后重试');
        (error as any).status = HttpStatus.TOO_MANY_REQUESTS;
        return error;
      });
    }

    // 跳过白名单
    if (this.config.whitelistPaths?.some(wp => path.startsWith(wp))) {
      return next.handle();
    }

    const key = `${ip}:${path}`;
    const now = Date.now();
    const buckets = this.store.get(key) || [];
    const validBuckets = buckets.filter(b => now - b.windowStart < (this.config.windowMs || 60000));
    validBuckets.push({ windowStart: now, count: 1 });

    const total = validBuckets.reduce((sum, b) => sum + b.count, 0);
    const maxReq = this.config.maxRequests || 60;

    if (total > maxReq) {
      this.store.set(key, validBuckets);
      const retryAfter = Math.ceil((validBuckets[0].windowStart + (this.config.windowMs || 60000) - now) / 1000);

      if (this.recordAbuse(ip, this.config.autoBanThreshold || 10)) {
        this.banIp(ip, this.config.autoBanDuration || 30 * 60 * 1000);
      }

      response.set({
        'RateLimit-Limit': String(maxReq),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': String(Math.ceil(Date.now() / 1000)),
        'Retry-After': String(retryAfter || 60),
      });

      return throwError(() => {
        const error = new Error(this.config.message || 'Too Many Requests');
        (error as any).status = HttpStatus.TOO_MANY_REQUESTS;
        return error;
      });
    }

    validBuckets[validBuckets.length - 1].count = total + 1;
    this.store.set(key, validBuckets);

    response.set({
      'RateLimit-Limit': String(maxReq),
      'RateLimit-Remaining': String(Math.max(0, maxReq - total - 1)),
      'RateLimit-Reset': String(Math.ceil(Date.now() / 1000)),
    });

    return next.handle();
  }
}
