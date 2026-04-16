import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { WechatPayService } from './wechat-pay.service'
import { AlipayService } from './alipay.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PrismaService } from '../../common/prisma/prisma.service'
import { IsString, IsIn } from 'class-validator'

// ==================== DTOs ====================

export class CreateSubscriptionDto {
  @IsString()
  planId: string

  @IsString()
  @IsIn(['weekly', 'monthly', 'quarterly', 'yearly'])
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly'

  @IsString()
  @IsIn(['wechat', 'alipay'])
  provider: 'wechat' | 'alipay'

  @IsString()
  channel: string

  @IsString()
  openId?: string
}

export class CancelSubscriptionDto {
  @IsString()
  @IsIn(['true', 'false'])
  immediate: string
}

// ==================== Controller ====================

@Controller('payment')
export class PaymentController {
  constructor(
    private subscriptionService: SubscriptionService,
    private wechatPayService: WechatPayService,
    private alipayService: AlipayService,
    private prisma: PrismaService,
  ) {}

  // ==================== 订阅方案 ====================

  /**
   * 获取订阅方案列表
   * GET /payment/plans
   */
  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans()
  }

  /**
   * 获取当前用户订阅状态
   * GET /payment/subscription
   */
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@Request() req) {
    return this.subscriptionService.getUserSubscription(req.user.id)
  }

  /**
   * 创建订阅订单
   * POST /payment/subscribe
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  async createSubscription(@Body() dto: CreateSubscriptionDto, @Request() req) {
    const result = await this.subscriptionService.createSubscription({
      userId: req.user.id,
      planId: dto.planId,
      period: dto.period,
      provider: dto.provider,
      channel: dto.channel,
    })

    return {
      success: true,
      data: result,
    }
  }

  /**
   * 取消订阅
   * POST /payment/subscription/cancel
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscription/cancel')
  async cancelSubscription(@Body() dto: CancelSubscriptionDto, @Request() req) {
    return this.subscriptionService.cancelSubscription(
      req.user.id,
      dto.immediate === 'true',
    )
  }

  /**
   * 恢复订阅自动续费
   * POST /payment/subscription/resume
   */
  @UseGuards(JwtAuthGuard)
  @Post('subscription/resume')
  async resumeSubscription(@Request() req) {
    return this.subscriptionService.resumeSubscription(req.user.id)
  }

  // ==================== 微信支付回调 ====================

  /**
   * 微信支付回调
   * POST /payment/wechat/notify
   */
  @Post('wechat/notify')
  async wechatNotify(@Body() notifyData: any) {
    try {
      const result = await this.wechatPayService.handleNotify(notifyData)

      if (result.success) {
        // 支付成功，激活订阅
        // await this.handlePaymentSuccess(result.paymentId)
        return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'
      } else {
        return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${result.message}]]></return_msg></xml>`
      }
    } catch (error) {
      console.error('Wechat notify error:', error)
      return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[系统异常]]></return_msg></xml>'
    }
  }

  /**
   * 查询微信支付订单状态
   * GET /payment/wechat/query/:paymentId
   */
  @UseGuards(JwtAuthGuard)
  @Get('wechat/query/:paymentId')
  async queryWechatOrder(@Param('paymentId') paymentId: string) {
    return this.wechatPayService.queryOrder(paymentId)
  }

  // ==================== 支付宝回调 ====================

  /**
   * 支付宝支付回调（同步回调）
   * POST /payment/alipay/return
   */
  @Post('alipay/return')
  async alipayReturn(@Body() returnData: Record<string, string>) {
    // 支付宝同步返回通常用于展示结果页面
    // 实际支付结果以异步通知为准
    const paymentId = returnData.out_trade_no
    return {
      success: true,
      data: {
        paymentId,
        message: '支付结果确认中，请稍候',
      },
    }
  }

  /**
   * 支付宝异步回调
   * POST /payment/alipay/notify
   */
  @Post('alipay/notify')
  async alipayNotify(@Body() notifyData: Record<string, string>) {
    try {
      const success = await this.alipayService.handleNotify(notifyData)

      if (success) {
        // 支付成功，激活订阅
        // await this.handlePaymentSuccess(notifyData.out_trade_no)
        return 'success'
      } else {
        return 'fail'
      }
    } catch (error) {
      console.error('Alipay notify error:', error)
      return 'fail'
    }
  }

  /**
   * 查询支付宝订单状态
   * GET /payment/alipay/query/:paymentId
   */
  @UseGuards(JwtAuthGuard)
  @Get('alipay/query/:paymentId')
  async queryAlipayOrder(@Param('paymentId') paymentId: string) {
    return this.alipayService.queryOrder(paymentId)
  }

  // ==================== 退款 ====================

  /**
   * 申请退款
   * POST /payment/refund
   */
  @UseGuards(JwtAuthGuard)
  @Post('refund')
  async refund(
    @Body() dto: { paymentId: string; reason?: string },
    @Request() req,
  ) {
    const payment = await this.prisma?.payment?.findFirst({
      where: {
        paymentId: dto.paymentId,
        userId: req.user.id,
        status: 'paid',
      },
    })

    if (!payment) {
      throw new Error('支付记录不存在或状态不允许退款')
    }

    if (payment.provider === 'wechat') {
      return this.wechatPayService.refund(
        dto.paymentId,
        Math.round(Number(payment.amount) * 100),
        dto.reason,
      )
    } else {
      return this.alipayService.refund({
        paymentId: dto.paymentId,
        refundAmount: Number(payment.amount),
        reason: dto.reason,
      })
    }
  }

  // ==================== 支付记录 ====================

  /**
   * 获取用户支付记录
   * GET /payment/history
   */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getPaymentHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    const skip = (Number(page) - 1) * Number(pageSize)

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
      }),
      this.prisma.payment.count({ where: { userId: req.user.id } }),
    ])

    return {
      success: true,
      data: {
        items: payments,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    }
  }

  /**
   * 获取单个支付详情
   * GET /payment/:paymentId
   */
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId')
  async getPaymentDetail(@Param('paymentId') paymentId: string, @Request() req) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        paymentId,
        userId: req.user.id,
      },
    })

    if (!payment) {
      throw new Error('支付记录不存在')
    }

    return {
      success: true,
      data: payment,
    }
  }
}
