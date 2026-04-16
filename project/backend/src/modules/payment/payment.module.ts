import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { SubscriptionService } from './subscription.service'
import { WechatPayService } from './wechat-pay.service'
import { AlipayService } from './alipay.service'

@Module({
  controllers: [PaymentController],
  providers: [SubscriptionService, WechatPayService, AlipayService],
  exports: [SubscriptionService, WechatPayService, AlipayService],
})
export class PaymentModule {}
