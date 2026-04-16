import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as crypto from 'crypto'
import * as qs from 'querystring'
import axios from 'axios'

/**
 * 支付宝支付服务
 * 支持：电脑网站支付、手机网站支付、APP支付
 */
@Injectable()
export class AlipayService {
  private readonly appId: string
  private readonly privateKey: string
  private readonly alipayPublicKey: string
  private readonly notifyUrl: string
  private readonly gateway: string
  private readonly sandbox: boolean

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.appId = this.configService.get<string>('ALIPAY_APP_ID') || ''
    this.privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY') || ''
    this.alipayPublicKey = this.configService.get<string>('ALIPAY_PUBLIC_KEY') || ''
    this.notifyUrl = this.configService.get<string>('ALIPAY_NOTIFY_URL') || 'https://api.example.com/payment/alipay/notify'
    
    // 沙箱环境
    this.sandbox = this.configService.get<string>('NODE_ENV') !== 'production'
    this.gateway = this.sandbox
      ? 'https://openapi.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do'
  }

  /**
   * 电脑网站支付 (Web支付)
   * 返回支付表单页面
   */
  async createWebOrder(params: {
    orderId: string
    amount: number
    subject: string
    userId: string
  }): Promise<{
    paymentId: string
    paymentForm: string  // 可直接提交的HTML表单
  }> {
    const { orderId, amount, subject, userId } = params

    // 创建支付记录
    const payment = await this.prisma.payment.create({
      data: {
        paymentId: this.generatePaymentId(),
        userId,
        orderId,
        type: 'subscription',
        provider: 'alipay',
        amount,
        currency: 'CNY',
        status: 'pending',
        channel: 'web',
      },
    })

    // 构建请求参数
    const bizContent = {
      out_trade_no: payment.paymentId,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: amount,
      subject: subject,
      body: subject,
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.page.pay',
        biz_content: bizContent,
        return_url: this.configService.get<string>('ALIPAY_RETURN_URL'),
      })

      // 生成跳转链接
      const payUrl = `${this.gateway}?${qs.stringify(params)}`

      return {
        paymentId: payment.paymentId,
        paymentForm: this.buildPayForm(payUrl),
      }
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
      throw new HttpException('支付宝支付创建失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 手机网站支付 (H5支付)
   */
  async createWapOrder(params: {
    orderId: string
    amount: number
    subject: string
    userId: string
  }): Promise<{
    paymentId: string
    paymentUrl: string
  }> {
    const { orderId, amount, subject, userId } = params

    const payment = await this.prisma.payment.create({
      data: {
        paymentId: this.generatePaymentId(),
        userId,
        orderId,
        type: 'subscription',
        provider: 'alipay',
        amount,
        currency: 'CNY',
        status: 'pending',
        channel: 'wap',
      },
    })

    const bizContent = {
      out_trade_no: payment.paymentId,
      product_code: 'QUICK_WAP_WAY',
      total_amount: amount,
      subject: subject,
      quit_url: this.configService.get<string>('FRONTEND_URL') || 'https://example.com',
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.wap.pay',
        biz_content: bizContent,
      })

      return {
        paymentId: payment.paymentId,
        paymentUrl: `${this.gateway}?${qs.stringify(params)}`,
      }
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
      throw new HttpException('支付宝H5支付创建失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * APP支付
   * 返回app支付参数（orderString）
   */
  async createAppOrder(params: {
    orderId: string
    amount: number
    subject: string
    userId: string
  }): Promise<{
    paymentId: string
    orderString: string
  }> {
    const { orderId, amount, subject, userId } = params

    const payment = await this.prisma.payment.create({
      data: {
        paymentId: this.generatePaymentId(),
        userId,
        orderId,
        type: 'subscription',
        provider: 'alipay',
        amount,
        currency: 'CNY',
        status: 'pending',
        channel: 'app',
      },
    })

    const bizContent = {
      out_trade_no: payment.paymentId,
      product_code: 'QUICK_MSECURITY_PAY',
      total_amount: amount,
      subject: subject,
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.app.pay',
        biz_content: bizContent,
      })

      return {
        paymentId: payment.paymentId,
        orderString: qs.stringify(params),
      }
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
      throw new HttpException('支付宝APP支付创建失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 支付回调处理
   */
  async handleNotify(notifyData: Record<string, string>): Promise<boolean> {
    // 验证签名
    const signVerified = this.verifySign(notifyData)

    if (!signVerified) {
      console.error('Alipay notify sign verify failed')
      return false
    }

    const { out_trade_no, trade_status, trade_no, gmt_payment } = notifyData

    const payment = await this.prisma.payment.findFirst({
      where: { paymentId: out_trade_no },
    })

    if (!payment) {
      console.error('Payment not found:', out_trade_no)
      return false
    }

    // 判断交易状态
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          paidAt: gmt_payment ? new Date(gmt_payment) : new Date(),
          rawResponse: notifyData,
        },
      })

      // 触发后续业务逻辑
      // await this.onPaymentSuccess(payment)

      return true
    }

    return false
  }

  /**
   * 查询订单状态
   */
  async queryOrder(paymentId: string): Promise<{
    status: string
    paidAt?: Date
  }> {
    const bizContent = {
      out_trade_no: paymentId,
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.query',
        biz_content: bizContent,
      })

      const response = await axios.post(this.gateway, qs.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      })

      const result = JSON.parse(response.data)
      const alipayResponse = result.alipay_trade_query_response

      if (alipayResponse.code === '10000') {
        return {
          status: alipayResponse.trade_status,
          paidAt: alipayResponse.gmt_payment ? new Date(alipayResponse.gmt_payment) : undefined,
        }
      } else {
        throw new HttpException(alipayResponse.sub_msg || '查询失败', HttpStatus.BAD_REQUEST)
      }
    } catch (error) {
      console.error('Alipay query error:', error)
      throw new HttpException('查询失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 申请退款
   */
  async refund(params: {
    paymentId: string
    refundAmount: number
    reason?: string
  }): Promise<{ refundId: string; status: string }> {
    const { paymentId, refundAmount, reason } = params

    const payment = await this.prisma.payment.findFirst({
      where: { paymentId },
    })

    if (!payment) {
      throw new HttpException('支付记录不存在', HttpStatus.NOT_FOUND)
    }

    if (payment.status !== 'paid') {
      throw new HttpException('只能退款已支付的订单', HttpStatus.BAD_REQUEST)
    }

    const bizContent = {
      out_trade_no: paymentId,
      refund_amount: refundAmount,
      refund_reason: reason || '用户申请退款',
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.refund',
        biz_content: bizContent,
      })

      const response = await axios.post(this.gateway, qs.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      })

      const result = JSON.parse(response.data)
      const alipayResponse = result.alipay_trade_refund_response

      if (alipayResponse.code === '10000') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundedAmount: refundAmount,
            refundedAt: new Date(),
          },
        })

        return {
          refundId: alipayResponse.trade_no,
          status: 'SUCCESS',
        }
      } else {
        throw new HttpException(alipayResponse.sub_msg || '退款失败', HttpStatus.BAD_REQUEST)
      }
    } catch (error) {
      console.error('Alipay refund error:', error)
      throw new HttpException('退款服务异常', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(paymentId: string): Promise<void> {
    const bizContent = {
      out_trade_no: paymentId,
    }

    try {
      const params = await this.buildParams({
        method: 'alipay.trade.close',
        biz_content: bizContent,
      })

      await axios.post(this.gateway, qs.stringify(params), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      })

      await this.prisma.payment.update({
        where: { paymentId },
        data: { status: 'cancelled' },
      })
    } catch (error) {
      console.error('Close order error:', error)
      throw new HttpException('关闭订单失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成支付单号
   */
  private generatePaymentId(): string {
    return `AP${Date.now()}${this.generateNonceStr(12)}`
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 构建签名参数
   */
  private async buildParams(bizParams: Record<string, any>): Promise<Record<string, string>> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', ' ').split('.')[0] + 'Z'
    
    const params: Record<string, string> = {
      app_id: this.appId,
      method: bizParams.method,
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp,
      version: '1.0',
      biz_content: JSON.stringify(bizParams.biz_content),
      notify_url: this.notifyUrl,
    }

    // 移除空值
    Object.keys(params).forEach(key => {
      if (!params[key]) delete params[key]
    })

    // 生成签名
    const sign = await this.sign(qs.stringify(params))
    params.sign = sign

    return params
  }

  /**
   * 签名
   */
  private async sign(content: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const sign = crypto
        .createSign('RSA-SHA256')
        .update(content)
        .sign(this.privateKey, 'base64')
      resolve(sign)
    })
  }

  /**
   * 验签
   */
  private verifySign(params: Record<string, string>): boolean {
    const { sign, ...data } = params
    const content = qs.stringify(data)
    
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(content)
    
    return verify.verify(this.alipayPublicKey, sign, 'base64')
  }

  /**
   * 构建支付表单
   */
  private buildPayForm(action: string): string {
    return `<form id="alipay" action="${action}" method="post">
      <input type="submit" value="正在跳转..." style="display:none">
    </form>
    <script>document.getElementById("alipay").submit();</script>`
  }
}
