'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// 套餐配置
const plans = {
  pro: {
    name: '专业版',
    price: 99,
    features: [
      '无限次AI选品分析',
      '查看全部爆品排行榜',
      '深度市场分析',
      '竞品监控',
      '导出分析报告(PDF)',
      '优先客服支持',
    ],
  },
  enterprise: {
    name: '企业版',
    price: 299,
    features: [
      '专业版全部功能',
      '多店铺管理',
      'API接口调用',
      '自定义关键词监控',
      '专属客户经理',
      '定制化培训',
    ],
  },
}

// 支付方式
const paymentMethods = [
  { id: 'alipay', name: '支付宝', icon: '💙', description: '推荐' },
  { id: 'wechat', name: '微信支付', icon: '💚', description: '' },
  { id: 'card', name: '信用卡', icon: '💳', description: 'Visa/Mastercard' },
]

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'pro'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPayment, setSelectedPayment] = useState('alipay')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  
  const plan = plans[planId as keyof typeof plans] || plans.pro
  const discount = billingCycle === 'yearly' ? 0.8 : 1
  const finalPrice = plan.price * discount

  // 处理支付错误码
  const handlePaymentError = (errorCode: string, message: string) => {
    setLoading(false)
    switch (errorCode) {
      case 'PAYMENT_ALREADY_PROCESSED':
        setError('该订单已支付，请勿重复支付')
        break
      case 'PAYMENT_EXPIRED':
        setError('订单已过期，请重新创建订单')
        break
      case 'PAYMENT_CANCELLED':
        setError('订单已取消')
        break
      case 'PAYMENT_FAILED':
        setError('支付失败，请稍后重试')
        break
      default:
        setError(message || '支付失败，请稍后重试')
    }
  }

  const handlePay = async () => {
    setLoading(true)
    setError('')
    
    try {
      // TODO: 调用后端支付API
      // const response = await fetch('/api/payment/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ planId, billingCycle, paymentMethod: selectedPayment })
      // })
      // 
      // if (response.data.errorCode) {
      //   handlePaymentError(response.data.errorCode, response.data.message)
      //   return
      // }
      
      // 模拟支付流程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setLoading(false)
      setStep(2)
    } catch (err: any) {
      // 处理API错误
      if (err.response?.data?.errorCode) {
        handlePaymentError(err.response.data.errorCode, err.response.data.message)
      } else {
        setError('支付失败，请检查网络连接后重试')
      }
    }
  }

  const handleComplete = () => {
    // 更新用户订阅状态
    localStorage.setItem('user', JSON.stringify({
      plan: planId,
      planName: plan.name,
    }))
    router.push('/dashboard')
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="glass-card p-8 text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">支付成功！</h1>
            <p className="text-gray-400 mb-6">
              感谢您的订阅，您现在是{plan.name}用户了
            </p>
            <div className="bg-dark/50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-400 mb-1">订单信息</div>
              <div className="text-white font-medium">{plan.name}</div>
              <div className="text-primary text-lg font-bold">
                ¥{finalPrice}/{billingCycle === 'yearly' ? '年' : '月'}
              </div>
            </div>
            <button onClick={handleComplete} className="btn-primary w-full">
              开始使用
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 mb-8">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <span>←</span>
          <span>返回定价页</span>
        </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：订单摘要 */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">确认订单</h1>
            
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">订阅方案</span>
                <span className="badge badge-primary">{plan.name}</span>
              </div>
              
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* 账单周期 */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-400'
                  }`}
                >
                  月付
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors relative ${
                    billingCycle === 'yearly'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-400'
                  }`}
                >
                  年付
                  <span className="absolute -top-2 -right-2 badge badge-success text-xs">省20%</span>
                </button>
              </div>

              <div className="border-t border-primary/20 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">原价</span>
                  <span className="text-gray-500 line-through">¥{plan.price}/月</span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">年付折扣</span>
                    <span className="text-green-400">-20%</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">应付金额</span>
                  <span className="gradient-text">
                    ¥{finalPrice}{billingCycle === 'yearly' ? '/年' : '/月'}
                  </span>
                </div>
              </div>
            </div>

            {/* 优惠码 */}
            <div className="glass-card p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入优惠码"
                  className="input-dark flex-1"
                />
                <button className="btn-secondary px-4">
                  兑换
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：支付方式 */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">选择支付方式</h1>
            
            <div className="glass-card p-6">
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`w-full p-4 rounded-lg flex items-center gap-4 transition-colors ${
                      selectedPayment === method.id
                        ? 'bg-primary/20 border border-primary'
                        : 'bg-dark hover:bg-dark/50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl">{method.icon}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{method.name}</div>
                      {method.description && (
                        <div className="text-xs text-gray-500">{method.description}</div>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      selectedPayment === method.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-600'
                    }`}>
                      {selectedPayment === method.id && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* 支付按钮 */}
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              
              <button
                onClick={handlePay}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>支付中...</span>
                  </>
                ) : (
                  <>
                    <span>💳</span>
                    <span>确认支付 ¥{finalPrice}</span>
                  </>
                )}
              </button>

              <p className="text-center text-gray-500 text-xs mt-4">
                点击确认即表示您同意我们的服务条款和自动续费条款
              </p>
            </div>

            {/* 安全提示 */}
            <div className="glass-card p-4 mt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="text-sm text-white font-medium">支付安全</div>
                  <div className="text-xs text-gray-500">您的支付信息已加密保护</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
