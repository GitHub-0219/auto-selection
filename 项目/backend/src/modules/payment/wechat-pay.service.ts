import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import * as crypto from 'crypto'
import axios from 'axios'

/**
 * 微信支付服务
 * 支持：Native支付、JSAPI支付、小程序支付
 */
@Injectable()
export class WechatPayService {
  private readonly mchId: string
  private readonly mchKey: string
  private readonly appId: string
  private readonly notifyUrl: string
  private readonly baseUrl: string
  private readonly useSandbox: boolean

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.mchId = this.configService.get<string>('WECHAT_MCH_ID') || ''
    this.mchKey = this.configService.get<string>('WECHAT_MCH_KEY') || ''
    this.appId = this.configService.get<string>('WECHAT_APP_ID') || ''
    this.notifyUrl = this.configService.get<string>('WECHAT_NOTIFY_URL') || 'https://api.example.com/payment/wechat/notify'
    this.baseUrl = this.configService.get<string>('WECHAT_API_BASE') || 'https://api.mch.weixin.qq.com'
    this.useSandbox = this.configService.get<string>('NODE_ENV') !== 'production'
  }

  /**
   * Native支付 - 生成二维码支付链接
   * 适用于PC网页
   */
  async createNativeOrder(params: {
    orderId: string
    amount: number  // 单位：分
    description: string
    userId: string
  }): Promise<{
    codeUrl: string  // 二维码链接
    qrCode: string    // 可生成的二维码内容
    paymentId: string
  }> {
    const { orderId, amount, description, userId } = params

    // 创建支付记录
    const payment = await this.prisma.payment.create({
      data: {
        paymentId: this.generatePaymentId(),
        userId,
        orderId,
        type: 'subscription',
        provider: 'wechat',
        amount: amount / 100,
        currency: 'CNY',
        status: 'pending',
        channel: 'native',
      },
    })

    // 构建统一下单请求
    const nonceStr = this.generateNonceStr()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    
    const signParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: nonceStr,
      body: description,
      out_trade_no: payment.paymentId,
      total_fee: amount,
      spbill_create_ip: '127.0.0.1', // TODO: 获取真实IP
      notify_url: this.notifyUrl,
      trade_type: 'NATIVE',
    }

    const sign = this.sign(signParams)
    const signType = 'MD5'

    try {
      // 调用微信统一下单API
      const response = await axios.post(
        `${this.baseUrl}/pay/unifiedorder`,
        this.toXml({ ...signParams, sign, sign_type: signType }),
        {
          headers: { 'Content-Type': 'text/xml' },
          timeout: 30000,
        },
      )

      const result = this.parseXml(response.data)

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        // 更新支付记录
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { prePayId: result.prepay_id },
        })

        return {
          codeUrl: result.code_url,
          qrCode: result.code_url,
          paymentId: payment.paymentId,
        }
      } else {
        throw new HttpException(
          result.err_code_des || result.return_msg || '微信支付下单失败',
          HttpStatus.BAD_REQUEST,
        )
      }
    } catch (error) {
      // 更新支付状态为失败
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })

      console.error('Wechat Pay Error:', error)
      throw new HttpException('微信支付服务异常', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * JSAPI支付 - 微信内网页支付
   */
  async createJsapiOrder(params: {
    orderId: string
    amount: number
    description: string
    userId: string
    openId: string
  }): Promise<{
    paymentId: string
    jsapiParams: {
      appId: string
      timeStamp: string
      nonceStr: string
      package: string
      signType: string
      paySign: string
    }
  }> {
    const { orderId, amount, description, userId, openId } = params

    // 创建支付记录
    const payment = await this.prisma.payment.create({
      data: {
        paymentId: this.generatePaymentId(),
        userId,
        orderId,
        type: 'subscription',
        provider: 'wechat',
        amount: amount / 100,
        currency: 'CNY',
        status: 'pending',
        channel: 'jsapi',
      },
    })

    // 统一下单
    const nonceStr = this.generateNonceStr()
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const signParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: nonceStr,
      body: description,
      out_trade_no: payment.paymentId,
      total_fee: amount,
      spbill_create_ip: '127.0.0.1',
      notify_url: this.notifyUrl,
      trade_type: 'JSAPI',
      openid: openId,
    }

    const sign = this.sign(signParams)

    try {
      const response = await axios.post(
        `${this.baseUrl}/pay/unifiedorder`,
        this.toXml({ ...signParams, sign }),
        { headers: { 'Content-Type': 'text/xml' }, timeout: 30000 },
      )

      const result = this.parseXml(response.data)

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        // 生成调起支付的参数
        const jsapiParams = {
          appId: this.appId,
          timeStamp: timestamp,
          nonceStr: nonceStr,
          package: `prepay_id=${result.prepay_id}`,
          signType: 'MD5',
        }

        return {
          paymentId: payment.paymentId,
          jsapiParams: {
            ...jsapiParams,
            paySign: this.sign(jsapiParams),
          },
        }
      } else {
        throw new HttpException(result.err_code_des || 'JSAPI支付下单失败', HttpStatus.BAD_REQUEST)
      }
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      })
      throw new HttpException('微信支付服务异常', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 微信支付回调处理
   */
  async handleNotify(notifyData: any): Promise<{
    success: boolean
    message: string
  }> {
    const xml = typeof notifyData === 'string' ? this.parseXml(notifyData) : notifyData

    // 验证签名
    const signParams = { ...xml }
    delete signParams.sign
    const calculatedSign = this.sign(signParams)

    if (calculatedSign !== xml.sign) {
      return { success: false, message: '签名验证失败' }
    }

    if (xml.return_code !== 'SUCCESS') {
      return { success: false, message: xml.return_msg }
    }

    // 查找并更新支付记录
    const payment = await this.prisma.payment.findFirst({
      where: { paymentId: xml.out_trade_no },
      include: { user: true },
    })

    if (!payment) {
      return { success: false, message: '支付记录不存在' }
    }

    if (payment.status === 'paid') {
      return { success: true, message: '已处理' }
    }

    // 更新支付状态
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        rawResponse: xml,
      },
    })

    // 触发后续业务逻辑（开通会员等）
    // await this.onPaymentSuccess(payment)

    return { success: true, message: 'OK' }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(paymentId: string): Promise<{
    status: string
    tradeState: string
    paidAt?: Date
  }> {
    const nonceStr = this.generateNonceStr()

    const signParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: nonceStr,
      out_trade_no: paymentId,
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/pay/orderquery`,
        this.toXml({ ...signParams, sign: this.sign(signParams) }),
        { headers: { 'Content-Type': 'text/xml' }, timeout: 30000 },
      )

      const result = this.parseXml(response.data)

      return {
        status: result.trade_state || 'UNKNOWN',
        tradeState: result.trade_state_desc || '',
        paidAt: result.time_end ? new Date(result.time_end) : undefined,
      }
    } catch (error) {
      throw new HttpException('查询失败', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  /**
   * 申请退款
   */
  async refund(paymentId: string, refundAmount: number, reason?: string): Promise<{
    refundId: string
    status: string
  }> {
    const payment = await this.prisma.payment.findFirst({
      where: { paymentId },
    })

    if (!payment) {
      throw new HttpException('支付记录不存在', HttpStatus.NOT_FOUND)
    }

    if (payment.status !== 'paid') {
      throw new HttpException('只能退款已支付的订单', HttpStatus.BAD_REQUEST)
    }

    const nonceStr = this.generateNonceStr()
    const refundId = `REF${Date.now()}${this.generateNonceStr(8)}`

    const signParams = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: nonceStr,
      transaction_id: paymentId,
      out_refund_no: refundId,
      total_fee: Math.round(payment.amount * 100),
      refund_fee: refundAmount,
      refund_desc: reason || '用户申请退款',
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/secapi/pay/refund`,
        this.toXml({ ...signParams, sign: this.sign(signParams) }),
        {
          headers: { 'Content-Type': 'text/xml' },
          timeout: 30000,
          // 生产环境需要使用证书
          // https: Agent(
          //   fs.readFileSync('/path/to/apiclient_cert.p12')
          // ),
        },
      )

      const result = this.parseXml(response.data)

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        // 更新支付记录
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundedAmount: refundAmount / 100,
            refundedAt: new Date(),
          },
        })

        return {
          refundId,
          status: 'SUCCESS',
        }
      } else {
        throw new HttpException(result.err_code_des || '退款失败', HttpStatus.BAD_REQUEST)
      }
    } catch (error) {
      console.error('Wechat Refund Error:', error)
      throw new HttpException('退款服务异常', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成支付单号
   */
  private generatePaymentId(): string {
    return `WX${Date.now()}${this.generateNonceStr(12)}`
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
   * 签名
   */
  private sign(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys
      .filter(key => params[key])
      .map(key => `${key}=${params[key]}`)
      .join('&')
    const signTarget = `${signStr}&key=${this.mchKey}`

    return crypto
      .createHash('md5')
      .update(signTarget)
      .digest('hex')
      .toUpperCase()
  }

  /**
   * 对象转XML
   */
  private toXml(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([key, value]) => `<${key}><![CDATA[${value}]]></${key}>`)
      .join('')
      .replace(/^/, '<xml>')
      .replace(/$/, '</xml>')
  }

  /**
   * XML转对象
   */
  private parseXml(xml: string): Record<string, string> {
    const result: Record<string, string> = {}
    const regex = /<(\w+)>(<!\[CDATA\[([\s\S]*?)\]\]>|([^<]+))<\/\1>/g
    let match
    while ((match = regex.exec(xml)) !== null) {
      result[match[1]] = match[3] || match[4] || ''
    }
    return result
  }
}
