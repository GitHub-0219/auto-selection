'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// 统计数据动画组件
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

// 功能卡片组件
function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: string
  title: string
  description: string
  delay: number
}) {
  return (
    <div 
      className="glass-card p-6 hover:scale-105 transition-all duration-300 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}

// 快捷入口组件
function QuickEntry({ 
  icon, 
  title, 
  href,
  color 
}: { 
  icon: string
  title: string
  href: string
  color: string
}) {
  return (
    <Link 
      href={href}
      className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-all duration-300 group"
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="text-white font-medium">{title}</span>
    </Link>
  )
}

export default function HomePage() {
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
              <span className="text-xs text-gray-500 block">AI跨境新手加速器</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link href="/ai-select" className="text-gray-400 hover:text-primary transition-colors">
              AI选品
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
              爆品分析
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-primary transition-colors">
              定价方案
            </Link>
          </nav>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              登录
            </Link>
            <Link 
              href="/register"
              className="btn-primary"
            >
              免费试用
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - 数据大屏风格 */}
      <section className="relative py-20 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* 标签 */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-primary text-sm">新用户首月5折优惠 · 14天免费试用</span>
            </div>
          </div>

          {/* 主标题 */}
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 animate-fade-in delay-100">
            <span className="text-white">AI赋能跨境电商</span>
            <br />
            <span className="gradient-text">让新手快速起步</span>
          </h1>

          {/* 副标题 */}
          <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-fade-in delay-200">
            智能选品、自动翻译、多平台运营，一站式跨境电商解决方案
          </p>

          {/* CTA按钮 */}
          <div className="flex justify-center gap-4 mb-16 animate-fade-in delay-300">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              立即开始 · 14天免费试用
            </Link>
            <Link href="/ai-select" className="btn-secondary text-lg px-8 py-4">
              体验AI选品
            </Link>
          </div>

          <p className="text-center text-gray-500 text-sm animate-fade-in delay-400">
            无需信用卡 · 随时取消 · 专属客服支持
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 10000, suffix: '+', label: '活跃卖家', icon: '👥' },
              { value: 50, suffix: '+', label: '支持语言', icon: '🌍' },
              { value: 100000, suffix: '+', label: '成功选品', icon: '📦' },
              { value: 98, suffix: '%', label: '用户满意度', icon: '⭐' },
            ].map((stat, i) => (
              <div 
                key={i}
                className="data-card text-center animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold gradient-text mb-1">
                  <AnimatedNumber value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Entry Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">快捷入口</h2>
            <p className="text-gray-400">选择您需要的服务，快速开始</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <QuickEntry icon="🤖" title="AI智能选品" href="/ai-select" color="rgba(15, 155, 142, 0.2)" />
            <QuickEntry icon="🔥" title="爆品排行榜" href="/dashboard" color="rgba(239, 68, 68, 0.2)" />
            <QuickEntry icon="💰" title="定价方案" href="/pricing" color="rgba(245, 158, 11, 0.2)" />
            <QuickEntry icon="📊" title="数据分析" href="/dashboard" color="rgba(99, 102, 241, 0.2)" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">核心功能</h2>
            <p className="text-gray-400">专为TikTok Shop东南亚卖家打造</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon="🎯"
              title="AI智能选品"
              description="基于市场趋势和竞争分析，AI为您推荐最具潜力的商品"
              delay={0}
            />
            <FeatureCard 
              icon="🌐"
              title="多语言翻译"
              description="支持50+语言的自动翻译，轻松触达全球买家"
              delay={100}
            />
            <FeatureCard 
              icon="📈"
              title="销售数据分析"
              description="实时监控销售数据，洞察市场动向"
              delay={200}
            />
            <FeatureCard 
              icon="⚡"
              title="快速上手"
              description="简单几步即可开始您的跨境电商之旅"
              delay={300}
            />
            <FeatureCard 
              icon="🛡️"
              title="安全可靠"
              description="企业级数据安全保障，保护您的商业机密"
              delay={400}
            />
            <FeatureCard 
              icon="💬"
              title="7x24支持"
              description="专属客服团队，随时为您解答疑问"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass-card p-12 text-center animate-pulse-glow">
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好开始您的跨境电商之旅了吗？
            </h2>
            <p className="text-gray-400 mb-8">
              加入10,000+卖家的行列，让AI助您成功
            </p>
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              立即免费试用
            </Link>
          </div>
        </div>
      </section>

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
