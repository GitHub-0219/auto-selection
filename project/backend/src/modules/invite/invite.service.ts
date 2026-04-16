import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as crypto from 'crypto'

/**
 * 邀请码服务
 * 管理邀请码生成、使用、返现
 */
@Injectable()
export class InviteService {
  // 邀请奖励配置
  private readonly rewardConfig = {
    // 邀请人获得的奖励
    inviterReward: 10, // 现金返现金额
    // 被邀请人获得的奖励
    inviteeReward: 5,  // 现金奖励
    // 邀请码有效期（天）
    codeExpiresDays: 30,
    // 最大使用次数
    maxUsage: 1,
  }

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // 从配置读取奖励设置
    const configReward = this.configService.get<number>('INVITE_REWARD_AMOUNT')
    if (configReward) {
      this.rewardConfig.inviterReward = configReward
    }
  }

  /**
   * 生成邀请码
   */
  async generateInviteCode(userId: string): Promise<{
    code: string
    expiresAt: Date
    rewardAmount: number
  }> {
    // 检查用户是否已有未过期的邀请码
    const existingCode = await this.prisma.inviteCode.findFirst({
      where: {
        inviterId: userId,
        status: 'unused',
        expiresAt: { gt: new Date() },
      },
    })

    if (existingCode) {
      return {
        code: existingCode.code,
        expiresAt: existingCode.expiresAt,
        rewardAmount: Number(existingCode.rewardAmount),
      }
    }

    // 生成新的邀请码
    const code = this.generateCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + this.rewardConfig.codeExpiresDays)

    const inviteCode = await this.prisma.inviteCode.create({
      data: {
        inviterId: userId,
        code,
        rewardAmount: this.rewardConfig.inviterReward,
        expiresAt,
      },
    })

    return {
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt,
      rewardAmount: Number(inviteCode.rewardAmount),
    }
  }

  /**
   * 使用邀请码 - [BUG-003 FIX] 细化错误码
   */
  async useInviteCode(userId: string, code: string): Promise<{
    success: boolean
    message: string
    reward?: {
      inviterReward: number
      inviteeReward: number
    }
  }> {
    // [BUG-007 FIX] 验证邀请码格式（6-12位字母数字）
    const INVITE_CODE_REGEX = /^[A-Za-z0-9]{6,12}$/
    if (!INVITE_CODE_REGEX.test(code)) {
      throw new HttpException(
        'INVITE_CODE_INVALID: 邀请码格式不正确（应为6-12位字母数字组合）',
        HttpStatus.BAD_REQUEST,
      )
    }

    // 查找邀请码
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { code },
      include: { inviter: true },
    })

    if (!inviteCode) {
      throw new HttpException('INVITE_CODE_NOT_FOUND: 邀请码不存在', HttpStatus.NOT_FOUND)
    }

    // [BUG-003 FIX] 细化错误码 - 不能邀请自己
    if (inviteCode.inviterId === userId) {
      throw new HttpException(
        'INVITE_SELF_USE: 不能使用自己的邀请码',
        HttpStatus.BAD_REQUEST,
      )
    }

    // [BUG-003 FIX] 细化错误码 - 邀请码已被使用
    if (inviteCode.status === 'used') {
      throw new HttpException(
        'INVITE_ALREADY_USED: 邀请码已被使用',
        HttpStatus.BAD_REQUEST,
      )
    }

    // [BUG-003 FIX] 细化错误码 - 邀请码已过期
    if (inviteCode.status === 'expired' || inviteCode.expiresAt < new Date()) {
      throw new HttpException(
        'INVITE_EXPIRED: 邀请码已过期',
        HttpStatus.BAD_REQUEST,
      )
    }

    // 检查用户是否已经使用过邀请码
    const usedCode = await this.prisma.inviteCode.findFirst({
      where: { inviteeId: userId },
    })

    if (usedCode) {
      throw new HttpException(
        'INVITE_ALREADY_CLAIMED: 您已经使用过邀请码',
        HttpStatus.BAD_REQUEST,
      )
    }

    // 使用邀请码
    await this.prisma.$transaction(async (tx) => {
      // 更新邀请码状态
      await tx.inviteCode.update({
        where: { id: inviteCode.id },
        data: {
          inviteeId: userId,
          status: 'used',
          usedAt: new Date(),
        },
      })

      // 给邀请人发放奖励
      await tx.inviteReward.create({
        data: {
          userId: inviteCode.inviterId,
          inviteCodeId: inviteCode.id,
          type: 'cash',
          amount: this.rewardConfig.inviterReward,
          status: 'available',
        },
      })

      // 给被邀请人发放奖励
      await tx.inviteReward.create({
        data: {
          userId: userId,
          inviteCodeId: inviteCode.id,
          type: 'cash',
          amount: this.rewardConfig.inviteeReward,
          status: 'available',
        },
      })

      // 创建积分记录
      await tx.pointTransaction.createMany({
        data: [
          {
            userId: inviteCode.inviterId,
            type: 'invite',
            amount: Math.round(this.rewardConfig.inviterReward * 100), // 转换为积分
            balance: 0, // TODO: 计算实际余额
            source: 'invite_reward',
            description: `邀请用户获得现金奖励`,
          },
          {
            userId: userId,
            type: 'invite',
            amount: Math.round(this.rewardConfig.inviteeReward * 100),
            balance: 0,
            source: 'invite_reward',
            description: `使用邀请码获得奖励`,
          },
        ],
      })
    })

    return {
      success: true,
      message: '邀请码使用成功',
      reward: {
        inviterReward: this.rewardConfig.inviterReward,
        inviteeReward: this.rewardConfig.inviteeReward,
      },
    }
  }

  /**
   * 获取用户的邀请记录
   */
  async getInviteRecords(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize

    const [invites, total] = await Promise.all([
      this.prisma.inviteCode.findMany({
        where: { inviterId: userId },
        include: {
          invitee: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.inviteCode.count({ where: { inviterId: userId } }),
    ])

    // 统计奖励
    const rewards = await this.prisma.inviteReward.aggregate({
      where: { userId, type: 'cash' },
      _sum: { amount: true },
      _count: true,
    })

    return {
      success: true,
      data: {
        records: invites.map(invite => ({
          code: invite.code,
          status: invite.status,
          usedAt: invite.usedAt,
          expiresAt: invite.expiresAt,
          invitee: invite.invitee,
        })),
        stats: {
          totalInvites: total,
          successfulInvites: invites.filter(i => i.status === 'used').length,
          totalReward: Number(rewards._sum.amount) || 0,
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
   * 获取我的邀请码
   */
  async getMyInviteCode(userId: string) {
    const inviteCode = await this.prisma.inviteCode.findFirst({
      where: {
        inviterId: userId,
        status: 'unused',
        expiresAt: { gt: new Date() },
      },
    })

    if (!inviteCode) {
      // 如果没有有效的，生成一个新的
      return this.generateInviteCode(userId)
    }

    return {
      success: true,
      data: {
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        rewardAmount: Number(inviteCode.rewardAmount),
        usageLimit: this.rewardConfig.maxUsage,
        status: inviteCode.status,
      },
    }
  }

  /**
   * 验证邀请码是否有效
   */
  async validateCode(code: string): Promise<{
    valid: boolean
    message?: string
    inviterName?: string
    reward?: number
  }> {
    const inviteCode = await this.prisma.inviteCode.findUnique({
      where: { code },
      include: { inviter: { select: { name: true } } },
    })

    if (!inviteCode) {
      return { valid: false, message: '邀请码不存在' }
    }

    if (inviteCode.status === 'used') {
      return { valid: false, message: '邀请码已被使用' }
    }

    if (inviteCode.status === 'expired' || inviteCode.expiresAt < new Date()) {
      return { valid: false, message: '邀请码已过期' }
    }

    return {
      valid: true,
      inviterName: inviteCode.inviter?.name,
      reward: Number(inviteCode.rewardAmount),
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成邀请码
   * 格式: 8位字母数字组合
   */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}
