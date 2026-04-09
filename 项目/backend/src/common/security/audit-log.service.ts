import { Injectable } from '@nestjs/common'
import { InjectPrisma } from './prisma-inject.decorator'

/**
 * 安全审计日志服务
 * 记录所有敏感操作，用于安全审计和合规
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectPrisma() private prisma: any,
  ) {}

  /**
   * 记录审计日志
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: this.generateId(),
          userId: params.userId,
          userRole: params.userRole,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          ip: params.ip,
          userAgent: params.userAgent,
          requestId: params.requestId,
          beforeValue: params.beforeValue ? JSON.stringify(params.beforeValue) : null,
          afterValue: params.afterValue ? JSON.stringify(params.afterValue) : null,
          status: params.status,
          reason: params.reason,
        },
      })
    } catch (error) {
      // 审计日志失败不应影响业务
      console.error('Failed to write audit log:', error)
    }
  }

  /**
   * 记录登录事件
   */
  async logLogin(params: {
    userId: string
    email: string
    ip: string
    userAgent: string
    success: boolean
    reason?: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: params.success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      resource: 'auth',
      resourceId: params.email,
      ip: params.ip,
      userAgent: params.userAgent,
      status: params.success ? 'success' : 'failed',
      reason: params.reason,
    })
  }

  /**
   * 记录登出事件
   */
  async logLogout(params: {
    userId: string
    ip: string
    userAgent: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: 'LOGOUT',
      resource: 'auth',
      resourceId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      status: 'success',
    })
  }

  /**
   * 记录密码修改
   */
  async logPasswordChange(params: {
    userId: string
    ip: string
    userAgent: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: 'PASSWORD_CHANGE',
      resource: 'user',
      resourceId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      status: 'success',
    })
  }

  /**
   * 记录权限变更
   */
  async logPermissionChange(params: {
    userId: string
    adminId: string
    oldRole: string
    newRole: string
    ip: string
    userAgent: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: 'PERMISSION_CHANGE',
      resource: 'user',
      resourceId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      beforeValue: { role: params.oldRole },
      afterValue: { role: params.newRole },
      status: 'success',
    })
  }

  /**
   * 记录敏感数据访问
   */
  async logSensitiveDataAccess(params: {
    userId: string
    dataType: string
    resourceId: string
    ip: string
    userAgent: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: 'SENSITIVE_DATA_ACCESS',
      resource: params.dataType,
      resourceId: params.resourceId,
      ip: params.ip,
      userAgent: params.userAgent,
      status: 'success',
    })
  }

  /**
   * 记录数据导出
   */
  async logDataExport(params: {
    userId: string
    exportType: string
    recordCount: number
    ip: string
    userAgent: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: 'DATA_EXPORT',
      resource: 'export',
      resourceId: params.exportType,
      ip: params.ip,
      userAgent: params.userAgent,
      afterValue: { recordCount: params.recordCount },
      status: 'success',
    })
  }

  /**
   * 记录支付操作
   */
  async logPayment(params: {
    userId: string
    orderId: string
    amount: number
    currency: string
    action: 'payment' | 'refund'
    ip: string
    userAgent: string
    success: boolean
    reason?: string
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      userRole: 'system',
      action: params.action === 'payment' ? 'PAYMENT' : 'REFUND',
      resource: 'order',
      resourceId: params.orderId,
      ip: params.ip,
      userAgent: params.userAgent,
      afterValue: {
        amount: params.amount,
        currency: params.currency,
      },
      status: params.success ? 'success' : 'failed',
      reason: params.reason,
    })
  }

  /**
   * 查询审计日志
   */
  async query(params: AuditLogQuery): Promise<{
    logs: any[]
    total: number
  }> {
    const where: any = {}

    if (params.userId) where.userId = params.userId
    if (params.action) where.action = params.action
    if (params.resource) where.resource = params.resource
    if (params.status) where.status = params.status
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip || 0,
        take: params.limit || 50,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `audit_${timestamp}_${random}`
  }
}

interface AuditLogParams {
  userId: string
  userRole: string
  action: string
  resource: string
  resourceId: string
  ip: string
  userAgent: string
  requestId?: string
  beforeValue?: Record<string, any>
  afterValue?: Record<string, any>
  status: 'success' | 'failed'
  reason?: string
}

interface AuditLogQuery {
  userId?: string
  action?: string
  resource?: string
  status?: string
  startDate?: Date
  endDate?: Date
  skip?: number
  limit?: number
}
