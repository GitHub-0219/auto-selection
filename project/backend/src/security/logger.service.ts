/**
 * Logger Service — NestJS 结构化日志
 */

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

@Injectable()
export class LoggerService {
  private writeStream: fs.WriteStream | null = null;
  private currentDate: string | null = null;

  constructor() {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    this.openLogFile();
    setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000);
  }

  private openLogFile() {
    const today = new Date().toISOString().split('T')[0];
    if (this.currentDate === today && this.writeStream) return;
    if (this.writeStream) this.writeStream.end();
    this.currentDate = today;
    this.writeStream = fs.createWriteStream(path.join(LOG_DIR, `app-${today}.log`), { flags: 'a' });
  }

  private writeToFile(level: string, message: string, meta?: any) {
    if (!this.writeStream) return;
    const ts = new Date().toISOString();
    const metaStr = meta ? JSON.stringify(meta).slice(0, 300) : '';
    this.writeStream.write(`[${level}] ${ts} ${message}${metaStr ? ' ' + metaStr : ''}\n`);
  }

  private cleanupOldLogs() {
    try {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(LOG_DIR);
      for (const file of files) {
        if (!file.startsWith('app-') || !file.endsWith('.log')) continue;
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.error('[Logger] 清理失败:', err);
    }
  }

  info(message: string, meta?: any) {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta || '');
    this.writeToFile('INFO', message, meta);
  }

  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta || '');
    this.writeToFile('WARN', message, meta);
  }

  error(message: string, trace?: string, meta?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, trace || '');
    this.writeToFile('ERROR', message, { ...meta, trace });
  }

  access(method: string, reqPath: string, status: number, duration: number, ip: string, userAgent?: string) {
    this.writeToFile('ACCESS', `${method} ${reqPath}`, {
      status, duration: `${duration}ms`, ip, userAgent: userAgent?.slice(0, 100),
    });
    if (status >= 400) {
      console.warn(`[ACCESS] ${method} ${reqPath} ${status} ${duration}ms from ${ip}`);
    }
  }
}
