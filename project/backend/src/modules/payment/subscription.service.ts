import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import { WechatPayService } from './wechat-pay.service'
import { AlipayService } from './alipay.service'

/**
 * 订阅服务
 * 管理订阅方案、会员开通、续费
 */
@Injectable()
export class SubscriptionService {
  // 默认订阅方案（可存储在数据库）
  private readonly defaultPlans = [
    {
      planId: 'basic',
      name: '基础会员',
      description: '适合个人跨境新手',
      price: 9.9,
      period: 'monthly' as const,
      periodDays: 30,
      features: [
        '每日10次选品报告',
        '每日50次翻译',
        '基础数据分析',
        '客服支持',
      ],
    },
    {
      planId: 'pro',
      name: '专业会员',
      description: '适合成长中的卖家',
      price: 29.9,
      period: 'monthly' as const,
      periodDays: 30,
      features: [
        '每日50次选品报告',
        '无限翻译',
        '高级数据分析',
        '视频脚本生成',
        '优先客服支持',
        'API调用权限',
      ],
    },
    {
      planId: 'enterprise',
      name: '企业会员',
      description: '适合团队和企业',
      price: 99.9,
      period: 'monthly' as const,
      periodDays: 30,
      features: [
        '无限次选品报告',
        '无限翻译',
        '全套数据分析',
        '无限视频脚本',
        '专属客户经理',
        '多账号管理',
        '定制化报告',
      ],
    },
  ]

  // 阶梯定价折扣
  private readonly periodDiscounts = {
    weekly: 1.0,      // 无折扣
    monthly: 1.0,      // 月付标准
    quarterly: 0.9,    // 季付9折
    yearly: 0.7,      // 年付7折
  }

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private wechatPayService: WechatPayService,
    private alipayService: AlipayService,
  ) {}

  /**
   * 获取所有可用的订阅方案
   */
  async getPlans() {
    // 优先从数据库获取，兜底使用默认方案
    let plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    if (plans.length === 0) {
      // 使用默认方案并创建记录
      for (const plan of this.defaultPlans) {
        await this.prisma.subscriptionPlan.create({ data: plan })
      }
      plans = await this.prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
    }

    return {
      success: true,
      data: {
        plans: plans.map(plan => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features as string) : plan.features,
        })),
        periodOptions: [
          { period: 'weekly', name: '周付', discount: 1.0 },
          { period: 'monthly', name: '月付', discount: 1.0 },
          { period: 'quarterly', name: '季付', discount: 0.9, popular: true },
          { period: 'yearly', name: '年付', discount: 0.7, bestValue: true },
        ],
      },
    }
  }

  /**
   * 计算订阅价格（考虑周期折扣）
   */
  calculatePrice(planPrice: number, period: string): {
    originalPrice: number
    discountedPrice: number
    discount: number
    discountAmount: number
  } {
    const discount = this.periodDiscounts[period as keyof typeof this.periodDiscounts] || 1.0
    const discountedPrice = Math.round(planPrice * discount * 100) / 100
    const discountAmount = Math.round((planPrice - discountedPrice) * 100) / 100

    return {
      originalPrice: planPrice,
      discountedPrice,
      discount: Math.round((1 - discount) * 100),
      discountAmount,
    }
  }

  /**
   * 创建订阅订单
   */
  async createSubscription(params: {
    userId: string
    planId: string
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    provider: 'wechat' | 'alipay'
    channel: string
  }): Promise<{
    orderId: string
    paymentId: string
    paymentUrl?: string
    qrCode?: string
    amount: number
    expiredAt: Date
  }> {
    const { userId, planId, period, provider, channel } = params

    // [BUG-002 FIX] 添加幂等性检查，防止重复支付
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        planId,
        status: { in: ['pending', 'active'] },
      },
    })

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        throw new HttpException(
          'PAYMENT_ALREADY_PROCESSED: 该订阅方案已支付，请勿重复支付',
          HttpStatus.BAD_REQUEST,
        )
      }
      // 返回已有的待支付订单
      return {
        orderId: existingSubscription.orderId,
        paymentId: existingSubscription.id,
        amount: Number(existingSubscription.amount),
        expiredAt: existingSubscription.expiredAt,
      }
    }

    // 获取订阅方案
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { planId },
    })

    if (!plan || !plan.isActive) {
      throw new HttpException('订阅方案不存在或已下架', HttpStatus.NOT_FOUND)
    }

    // 计算价格
    const pricing = this.calculatePrice(Number(plan.price), period)
    const amount = pricing.discountedPrice

    // 生成订单号
    const orderId = `SUB${Date.now()}${this.randomString(8)}`

    // 计算过期时间
    const periodDays = this.getPeriodDays(period, plan.periodDays)
    const expiredAt = new Date()
    expiredAt.setDate(expiredAt.getDate() + periodDays)

    // 创建支付
    let paymentResult: any = {}

    if (provider === 'wechat') {
      if (channel === 'native') {
        paymentResult = await this.wechatPayService.createNativeOrder({
          orderId,
          amount: Math.round(amount * 100), // 转换为分
          description: `${plan.name} - ${this.getPeriodName(period)}`,
          userId,
        })
      } else {
        // JSAPI需要openId
        throw new BadRequestException('JSAPI支付需要提供openId')
      }
    } else if (provider === 'alipay') {
      if (channel === 'web') {
        paymentResult = await this.alipayService.createWebOrder({
          orderId,
          amount,
          subject: `${plan.name} - ${this.getPeriodName(period)}`,
          userId,
        })
      } else if (channel === 'wap') {
        paymentResult = await this.alipayService.createWapOrder({
          orderId,
          amount,
          subject: `${plan.name} - ${this.getPeriodName(period)}`,
          userId,
        })
      } else if (channel === 'app') {
        paymentResult = await this.alipayService.createAppOrder({
          orderId,
          amount,
          subject: `${plan.name} - ${this.getPeriodName(period)}`,
          userId,
        })
      }
    }

    return {
      orderId,
      paymentId: paymentResult.paymentId,
      paymentUrl: paymentResult.paymentUrl,
      qrCode: paymentResult.qrCode,
      amount,
      expiredAt,
    }
  }

  /**
   * 开通/更新订阅
   */
  async activateSubscription(params: {
    userId: string
    planId: string
    period: string
    paymentId: string
  }): Promise<{
    membership: any
    subscription: any
  }> {
    const { userId, planId, period, paymentId } = params

    // 验证支付状态
    const payment = await this.prisma.payment.findFirst({
      where: { paymentId },
    })

    if (!payment) {
      throw new HttpException('支付记录不存在', HttpStatus.NOT_FOUND)
    }

    if (payment.status !== 'paid') {
      throw new HttpException('支付未完成', HttpStatus.BAD_REQUEST)
    }

    // 获取订阅方案
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { planId },
    })

    if (!plan) {
      throw new HttpException('订阅方案不存在', HttpStatus.NOT_FOUND)
    }

    // 计算有效期
    const periodDays = this.getPeriodDays(period, plan.periodDays)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + periodDays)

    // 检查现有订阅
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    })

    let subscription: any
    let membership: any

    await this.prisma.$transaction(async (tx) => {
      // 如果有活跃订阅，先取消
      if (existingSubscription) {
        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
      }

      // 创建新订阅
      subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          status: 'active',
          startDate,
          endDate,
          autoRenew: true,
        },
      })

      // 更新会员信息
      const roleMap: Record<string, 'free' | 'basic' | 'pro' | 'enterprise'> = {
        basic: 'basic',
        pro: 'pro',
        enterprise: 'enterprise',
      }

      membership = await tx.membership.upsert({
        where: { userId },
        create: {
          userId,
          plan: roleMap[planId] || 'basic',
          status: 'active',
          startDate,
          endDate,
          features: plan.features as string[],
        },
        update: {
          plan: roleMap[planId] || 'basic',
          status: 'active',
          startDate,
          endDate,
          features: plan.features as string[],
        },
      })

      // 更新用户角色
      await tx.user.update({
        where: { id: userId },
        data: { role: roleMap[planId] || 'basic' },
      })
    })

    return { membership, subscription }
  }

  /**
   * 获取用户订阅状态
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
    })

    const membership = await this.prisma.membership.findUnique({
      where: { userId },
    })

    return {
      success: true,
      data: {
        subscription: subscription ? {
          ...subscription,
          plan: subscription.plan ? {
            ...subscription.plan,
            features: typeof subscription.plan.features === 'string' 
              ? JSON.parse(subscription.plan.features as string) 
              : subscription.plan.features,
          } : null,
        } : null,
        membership: membership ? {
          ...membership,
          features: typeof membership.features === 'string'
            ? JSON.parse(membership.features as string)
            : membership.features,
        } : null,
        isActive: subscription?.status === 'active' && new Date(subscription.endDate) > new Date(),
        daysRemaining: subscription?.endDate
          ? Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
      },
    }
  }

  /**
   * 取消订阅
   */
  async cancelSubscription(userId: string, immediate: boolean = false) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
    })

    if (!subscription) {
      throw new HttpException('没有找到活跃订阅', HttpStatus.NOT_FOUND)
    }

    if (immediate) {
      await this.prisma.$transaction([
        this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        }),
        this.prisma.membership.update({
          where: { userId },
          data: { status: 'expired' },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { role: 'free' },
        }),
      ])
    } else {
      // 取消自动续费，到期后失效
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { autoRenew: false },
      })
    }

    return {
      success: true,
      message: immediate ? '订阅已立即取消' : '自动续费已取消，到期后会员将失效',
    }
  }

  /**
   * 恢复订阅自动续费
   */
  async resumeSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active', autoRenew: false },
    })

    if (!subscription) {
      throw new HttpException('没有找到已取消自动续费的订阅', HttpStatus.NOT_FOUND)
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { autoRenew: true },
    })

    return {
      success: true,
      message: '自动续费已恢复',
    }
  }

  // ==================== 辅助方法 ====================

  private getPeriodDays(period: string, baseDays: number): number {
    const multipliers: Record<string, number> = {
      weekly: 1,
      monthly: 1,
      quarterly: 3,
      yearly: 12,
    }
    return baseDays * (multipliers[period] || 1)
  }

  private getPeriodName(period: string): string {
    const names: Record<string, string> = {
      weekly: '周',
      monthly: '月',
      quarterly: '季',
      yearly: '年',
    }
    return names[period] || period
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}
