import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'

/**
 * 积分服务
 * 管理用户积分获取、消费、查询
 */
@Injectable()
export class PointsService {
  // 积分规则配置
  private readonly rules = {
    // 消费返积分 (每消费1元返积分)
    purchaseRate: 10,
    // 积分抵现比例 (多少积分抵1元)
    redemptionRate: 100,  // 100积分 = 1元
    // 积分有效期 (天)
    expiryDays: 365,
    // 最低抵扣积分
    minRedemptionPoints: 100,
  }

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * 获取用户积分余额
   */
  async getBalance(userId: string): Promise<{
    balance: number
    pendingPoints: number
    expiringPoints: number
    expiryDate: Date | null
  }> {
    // 计算当前总积分
    const transactions = await this.prisma.pointTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    })

    const balance = transactions._sum.amount || 0

    // 获取即将过期的积分（30天内）
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const expiringRecords = await this.prisma.pointTransaction.findMany({
      where: {
        userId,
        createdAt: {
          lt: new Date(Date.now() - (this.rules.expiryDays - 30) * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    let expiringPoints = 0
    for (const record of expiringRecords) {
      expiringPoints += record.amount > 0 ? record.amount : 0
    }

    // 获取最早获得的积分（用于计算过期日期）
    const earliestRecord = await this.prisma.pointTransaction.findFirst({
      where: { userId, amount: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    })

    let expiryDate: Date | null = null
    if (earliestRecord) {
      expiryDate = new Date(earliestRecord.createdAt)
      expiryDate.setDate(expiryDate.getDate() + this.rules.expiryDays)
    }

    return {
      balance,
      pendingPoints: 0, // TODO: 待生效积分
      expiringPoints,
      expiryDate,
    }
  }

  /**
   * 获取积分明细
   */
  async getTransactions(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize

    const [transactions, total, balanceResult] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.pointTransaction.count({ userId }),
      this.getBalance(userId),
    ])

    return {
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balance: t.balance,
          source: t.source,
          description: t.description,
          createdAt: t.createdAt,
        })),
        summary: {
          balance: balanceResult.balance,
          expiringPoints: balanceResult.expiringPoints,
          expiryDate: balanceResult.expiryDate,
        },
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    }
  }

  /**
   * 添加积分
   */
  async addPoints(params: {
    userId: string
    amount: number
    type: 'purchase' | 'reward' | 'invite' | 'refund'
    source: string
    description: string
    orderId?: string
  }): Promise<{ newBalance: number }> {
    const { userId, amount, type, source, description, orderId } = params

    if (amount <= 0) {
      throw new HttpException('积分数量必须大于0', HttpStatus.BAD_REQUEST)
    }

    // 获取当前余额
    const currentBalance = await this.getBalance(userId)
    const newBalance = currentBalance.balance + amount

    await this.prisma.pointTransaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        source,
        orderId,
        description,
      },
    })

    return { newBalance }
  }

  /**
   * 消费积分
   */
  async consumePoints(params: {
    userId: string
    amount: number
    source: string
    description: string
  }): Promise<{ newBalance: number }> {
    const { userId, amount, source, description } = params

    if (amount <= 0) {
      throw new HttpException('积分数量必须大于0', HttpStatus.BAD_REQUEST)
    }

    if (amount < this.rules.minRedemptionPoints) {
      throw new HttpException(`最低抵扣积分数为${this.rules.minRedemptionPoints}`, HttpStatus.BAD_REQUEST)
    }

    // 获取当前余额
    const currentBalance = await this.getBalance(userId)

    if (currentBalance.balance < amount) {
      throw new HttpException('积分余额不足', HttpStatus.BAD_REQUEST)
    }

    const newBalance = currentBalance.balance - amount

    await this.prisma.pointTransaction.create({
      data: {
        userId,
        type: 'consumption',
        amount: -amount,
        balance: newBalance,
        source,
        description,
      },
    })

    return { newBalance }
  }

  /**
   * 积分抵现计算
   */
  calculateRedemption(points: number): {
    points,
    canRedeem: boolean
    redeemAmount: number
    minimumRequired: number
  } {
    const canRedeem = points >= this.rules.minRedemptionPoints
    const redeemAmount = Math.floor(points / this.rules.redemptionRate)

    return {
      points,
      canRedeem,
      redeemAmount,
      minimumRequired: this.rules.minRedemptionPoints,
    }
  }

  /**
   * 获取积分规则
   */
  getRules() {
    return {
      success: true,
      data: {
        purchaseRate: this.rules.purchaseRate,      // 每消费1元返积分
        redemptionRate: this.rules.redemptionRate,  // 积分抵现比例
        minRedemptionPoints: this.rules.minRedemptionPoints,
        expiryDays: this.rules.expiryDays,
        descriptions: {
          purchaseRate: `每消费1元可获得${this.rules.purchaseRate}积分`,
          redemptionRate: `${this.rules.redemptionRate}积分可抵扣1元`,
          expiryDays: `积分有效期${this.rules.expiryDays}天`,
          minRedemption: `单次最低使用${this.rules.minRedemptionPoints}积分`,
        },
      },
    }
  }

  /**
   * 处理消费返积分
   * 当用户完成一笔订单后调用
   */
  async processPurchaseReward(userId: string, orderAmount: number, orderId: string) {
    const points = Math.floor(orderAmount * this.rules.purchaseRate)
    
    return this.addPoints({
      userId,
      amount: points,
      type: 'purchase',
      source: 'order_reward',
      description: `订单返积分`,
      orderId,
    })
  }

  /**
   * 清理过期积分 (定时任务)
   */
  async cleanupExpiredPoints() {
    const expiryThreshold = new Date()
    expiryThreshold.setDate(expiryThreshold.getDate() - this.rules.expiryDays)

    // 查找过期的积分记录
    const expiredRecords = await this.prisma.pointTransaction.findMany({
      where: {
        createdAt: { lt: expiryThreshold },
        amount: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 按用户分组计算过期积分
    const userExpiredPoints: Record<string, number> = {}
    for (const record of expiredRecords) {
      if (!userExpiredPoints[record.userId]) {
        userExpiredPoints[record.userId] = 0
      }
      userExpiredPoints[record.userId] += record.amount
    }

    // 为每个用户创建过期记录
    for (const [userId, expiredPoints] of Object.entries(userExpiredPoints)) {
      const currentBalance = await this.getBalance(userId)
      const actualExpired = Math.min(expiredPoints, currentBalance.balance)

      if (actualExpired > 0) {
        await this.prisma.pointTransaction.create({
          data: {
            userId,
            type: 'expiry',
            amount: -actualExpired,
            balance: currentBalance.balance - actualExpired,
            source: 'point_expiry',
            description: `积分过期扣除`,
          },
        })
      }
    }

    return {
      processedUsers: Object.keys(userExpiredPoints).length,
      totalExpiredPoints: Object.values(userExpiredPoints).reduce((a, b) => a + b, 0),
    }
  }
}
