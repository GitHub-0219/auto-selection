/**
 * Database Backup Cron Job — 定时备份 PostgreSQL
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const RETENTION_DAYS = 7;
const MAX_BACKUPS = 10;
const RECORD_FILE = path.join(BACKUP_DIR, 'backup-records.json');

@Injectable()
export class DatabaseBackupCronService {
  private readonly logger = new Logger(DatabaseBackupCronService.name);

  constructor() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  @Cron('0 2 * * *')
  async backup() {
    this.logger.log('开始数据库备份...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `postgres-backup-${timestamp}`;
      const dumpFile = path.join(BACKUP_DIR, `${backupName}.sql`);
      const tarFile = `${backupName}.tar.gz`;
      const databaseUrl = process.env.DATABASE_URL || '';

      if (!databaseUrl) {
        this.logger.error('DATABASE_URL 未配置');
        return;
      }

      try { await execAsync('which pg_dump'); } catch {
        this.logger.error('pg_dump 未安装');
        return;
      }

      await execAsync(`pg_dump "${databaseUrl}" > "${dumpFile}"`);
      const sqlSize = fs.statSync(dumpFile).size / 1024;
      this.logger.log(`SQL 转储完成: ${sqlSize}KB`);

      await execAsync(`cd ${BACKUP_DIR} && tar -czf ${tarFile} ${backupName}.sql`);
      fs.unlinkSync(dumpFile);

      this.recordBackup('postgres', tarFile, fs.statSync(path.join(BACKUP_DIR, tarFile)).size / 1024);
      await this.cleanup();
      this.logger.log(`✅ 备份完成: ${tarFile}`);
    } catch (error) {
      this.logger.error(`❌ 备份失败: ${error.message}`);
    }
  }

  @Cron('0 3 * * 0')
  async cleanup() {
    try {
      const now = Date.now();
      const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.tar.gz'))
        .map(f => ({ name: f, path: path.join(BACKUP_DIR, f) }))
        .map(f => ({ ...f, mtime: fs.statSync(f.path).mtimeMs }))
        .sort((a, b) => a.mtime - b.mtime);

      let removed = 0;
      for (const file of files) {
        if (file.mtime < cutoff) { fs.unlinkSync(file.path); removed++; }
      }

      const remaining = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.tar.gz'));
      while (remaining.length > MAX_BACKUPS) {
        const oldest = remaining.shift();
        fs.unlinkSync(path.join(BACKUP_DIR, oldest));
        removed++;
      }
      this.logger.log(`清理完成: 删除 ${removed} 个旧备份`);
    } catch (error) {
      this.logger.error(`清理失败: ${error.message}`);
    }
  }

  private recordBackup(type: string, filename: string, sizeKB: number) {
    let records: any[] = [];
    if (fs.existsSync(RECORD_FILE)) {
      try { records = JSON.parse(fs.readFileSync(RECORD_FILE, 'utf-8')); } catch { records = []; }
    }
    records.unshift({ type, filename, timestamp: new Date().toISOString(), sizeKB });
    if (records.length > 30) records = records.slice(0, 30);
    fs.writeFileSync(RECORD_FILE, JSON.stringify(records, null, 2));
  }
}
