'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 演示模式：demo@example.com 或 demo 直接跳转
      if (formData.email === 'demo@example.com' || formData.email === 'demo') {
        localStorage.setItem('token', 'demo_token_' + Date.now())
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          name: '演示用户',
          email: formData.email,
          plan: 'free'
        }))
        router.push('/dashboard')
        return
      }

      // 实际API调用
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      })
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.accessToken)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        router.push('/dashboard')
      }
    } catch (err: any) {
      // 处理429限流错误
      if (err.response?.status === 429 || err.response?.data?.errorCode === 'TOO_MANY_REQUESTS') {
        setError('登录尝试次数过多，请15分钟后重试')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('无法连接到服务器，请确保后端服务已启动')
      } else {
        setError('登录失败，请检查网络连接')
      }
    } finally {
      setLoading(false)
    }
  }

  // 第三方登录
  const handleThirdPartyLogin = (provider: string) => {
    // TODO: 实现第三方登录
    alert(`${provider} 登录功能开发中...`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold gradient-text">Auto选品</span>
              <span className="text-xs text-gray-500 block">AI跨境新手加速器</span>
            </div>
          </Link>
        </div>

        {/* 登录卡片 */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">欢迎回来</h1>
            <p className="text-gray-400">登录您的账户，开始智能选品之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 邮箱 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📧</span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-dark w-full pl-12"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-dark w-full pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* 验证码（可选） */}
            {showCodeInput && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  验证码
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="input-dark flex-1"
                    placeholder="请输入验证码"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={countdown > 0}
                    className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-dark focus:ring-primary" />
                <span className="text-gray-400">记住我</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {showCodeInput ? '使用密码登录' : '验证码登录'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>登录中...</span>
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark text-gray-500">或</span>
            </div>
          </div>

          {/* 第三方登录 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('Google')}
              className="glass-card px-4 py-3 flex items-center justify-center gap-2 hover:bg-dark/50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-300">Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleThirdPartyLogin('TikTok')}
              className="glass-card px-4 py-3 flex items-center justify-center gap-2 hover:bg-dark/50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
              <span className="text-gray-300">TikTok</span>
            </button>
          </div>

          {/* 演示模式 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setFormData({ email: 'demo@example.com', password: 'demo123' })}
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
            >
              演示模式：点击自动填充 →
            </button>
          </div>
        </div>

        {/* 注册链接 */}
        <p className="text-center mt-6 text-gray-400">
          还没有账户？{' '}
          <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}
