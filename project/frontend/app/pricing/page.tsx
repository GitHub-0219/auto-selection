'use client'

import { useState } from 'react'
import Link from 'next/link'

// 套餐配置
const plans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    description: '适合新手体验',
    features: [
      '每天5次AI选品分析',
      '查看前100个爆品',
      '基础市场数据',
      '社群支持',
    ],
    limitations: [
      '无法导出报告',
      '无法使用深度分析',
      '广告展示',
    ],
    highlighted: false,
    badge: null,
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    period: '/月',
    description: '适合成长中的卖家',
    features: [
      '无限次AI选品分析',
      '查看全部爆品排行榜',
      '深度市场分析',
      '竞品监控',
      '导出分析报告(PDF)',
      '优先客服支持',
    ],
    limitations: [],
    highlighted: true,
    badge: '最受欢迎',
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    period: '/月',
    description: '适合规模化运营',
    features: [
      '专业版全部功能',
      '多店铺管理',
      'API接口调用',
      '自定义关键词监控',
      '专属客户经理',
      '定制化培训',
    ],
    limitations: [],
    highlighted: false,
    badge: null,
  },
]

// 常见问题
const faqs = [
  {
    q: '免费试用需要绑定信用卡吗？',
    a: '不需要！我们提供14天免费试用，无需绑定信用卡，试用期满后再选择是否订阅。',
  },
  {
    q: '可以随时取消订阅吗？',
    a: '可以随时取消，取消后您的订阅将在当前周期结束时失效，不会收取额外费用。',
  },
  {
    q: '如何获取发票？',
    a: '订阅成功后，您可以在个人中心的订阅管理中申请电子发票，我们会在1-3个工作日内发送至您的邮箱。',
  },
  {
    q: '支持哪些支付方式？',
    a: '我们支持支付宝、微信支付、信用卡（Visa/Mastercard）等多种支付方式。',
  },
  {
    q: '企业版有什么定制服务？',
    a: '企业版用户可享受专属客户经理服务、定制化培训、以及API接口对接支持，满足您的个性化需求。',
  },
]

// 邀请奖励说明
const inviteRewards = {
  title: '邀请好友奖励',
  description: '每成功邀请一位好友注册，双方都可获得',
  rewards: [
    { icon: '🎁', text: '免费延长7天专业版' },
    { icon: '💰', text: '好友首单金额的5%返利' },
    { icon: '⭐', text: '邀请排行榜前10名额外奖励' },
  ],
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    if (planId === 'free') {
      // 直接注册
      window.location.href = '/register'
    } else {
      // 跳转到支付页
      window.location.href = `/pricing/payment?plan=${planId}`
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 !bg-dark/80 !border-b !border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">Auto选品</span>
            </div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
              爆品分析
            </Link>
            <Link href="/ai-select" className="text-gray-400 hover:text-primary transition-colors">
              AI选品
            </Link>
            <Link href="/pricing" className="text-primary font-medium">
              定价方案
            </Link>
          </nav>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              登录
            </Link>
            <Link href="/register" className="btn-primary">
              免费试用
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h1 className="text-4xl font-bold text-white mb-4">
              选择适合您的方案
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              灵活的价格方案，满足不同规模的跨境电商卖家
            </p>

            {/* 账单周期切换 */}
            <div className="inline-flex items-center gap-4 p-1 glass-card rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                月付
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition-colors flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                年付
                <span className="badge badge-success text-xs">省20%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`glass-card p-6 relative transition-all ${
                    plan.highlighted
                      ? 'border-primary scale-105 animate-pulse-glow'
                      : ''
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-primary text-white text-sm rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6 pt-4">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold gradient-text">
                        ¥{plan.price}
                      </span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <div className="text-sm text-green-400 mt-1">
                        年付省 ¥{plan.price * 12 * 0.2}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-center gap-2 opacity-50">
                        <span className="text-gray-500">✗</span>
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      plan.highlighted
                        ? 'btn-primary'
                        : 'bg-dark border border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {plan.price === 0 ? '免费开始' : '立即订阅'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Invite Rewards */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="glass-card p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-4xl mb-4">{inviteRewards.title.includes('邀请') ? '🎁' : '🎁'}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{inviteRewards.title}</h3>
                  <p className="text-gray-400 mb-4">{inviteRewards.description}</p>
                </div>
                <div className="space-y-4">
                  {inviteRewards.rewards.map((reward, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-dark/50 rounded-lg">
                      <span className="text-2xl">{reward.icon}</span>
                      <span className="text-gray-300">{reward.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-primary/20 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  已有 <span className="text-primary font-medium">1,234</span> 位用户通过邀请获得奖励
                </div>
                <button className="btn-secondary">
                  邀请好友
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              常见问题
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <span className="text-white font-medium">{faq.q}</span>
                    <span className={`text-primary transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-gray-400 text-sm animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="glass-card p-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                准备好开始了吗？
              </h2>
              <p className="text-gray-400 mb-8">
                加入10,000+卖家的行列，让AI助您成功
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/register" className="btn-primary">
                  立即免费试用
                </Link>
                <button className="btn-secondary">
                  联系我们
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <span>🚀</span>
              </div>
              <span className="text-lg font-bold text-white">Auto选品</span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 Auto选品. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
