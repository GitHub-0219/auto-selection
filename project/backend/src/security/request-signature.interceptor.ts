/**
 * Request Signature Interceptor — 请求签名验证
 * HMAC-SHA256 + 防重放攻击
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

const SECRET_KEY = process.env.SIGN_SECRET || 'change-me-in-production';
const TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 分钟

@Injectable()
export class RequestSignatureInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!SECRET_KEY || SECRET_KEY === 'change-me-in-production') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest();

    // 仅对非 GET 请求验证
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next.handle();
    }

    const signature = request.headers['x-signature'] as string;
    const timestamp = request.headers['x-timestamp'] as string;
    const appKey = request.headers['x-app-key'] as string;

    if (!signature || !timestamp || !appKey) {
      throw new UnauthorizedException('缺少请求签名');
    }

    // 验证时间戳
    const reqTime = parseInt(timestamp, 10);
    if (Math.abs(Date.now() - reqTime) > TIMESTAMP_TOLERANCE) {
      throw new UnauthorizedException('请求已过期');
    }

    // 验证签名
    const body = (request.method === 'POST' || request.method === 'PUT')
      ? JSON.stringify(request.body || {})
      : '';
    const raw = `${appKey}${timestamp}${body}${SECRET_KEY}`;
    const expected = crypto.createHmac('sha256', SECRET_KEY)
      .update(raw).digest('hex');

    if (signature !== expected) {
      throw new UnauthorizedException('签名验证失败');
    }

    return next.handle();
  }
}
