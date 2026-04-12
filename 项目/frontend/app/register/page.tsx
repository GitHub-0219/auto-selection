'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    country: 'Thailand',
    agreeTerms: false,
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 发送验证码
  const sendVerificationCode = () => {
    if (!formData.email) {
      setError('请输入邮箱地址')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      return
    }
    alert(`验证码已发送至 ${formData.email}`)
  }

  const handleNextStep = () => {
    setError('')
    
    if (step === 1) {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('请输入有效的邮箱地址')
        return
      }
      if (!formData.agreeTerms) {
        setError('请同意服务条款')
        return
      }
      sendVerificationCode()
      setStep(2)
    } else if (step === 2) {
      if (!verificationCode || verificationCode.length !== 6) {
        setError('请输入6位验证码')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!formData.name.trim()) {
        setError('请输入您的姓名')
        return
      }
      if (!formData.password || formData.password.length < 6) {
        setError('密码长度至少为6位')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致')
        return
      }
      handleRegister()
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    setError('')

    try {
      // 实际API调用
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.accessToken)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        router.push('/dashboard')
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('无法连接到服务器，请确保后端服务已启动')
      } else {
        setError('注册失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
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

        {/* 注册卡片 */}
        <div className="glass-card p-8">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-500'
                  }`}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step > s ? 'bg-primary' : 'bg-dark'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 1 && '创建账户'}
              {step === 2 && '验证邮箱'}
              {step === 3 && '设置密码'}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1 && '输入您的邮箱开始注册'}
              {step === 2 && '我们已发送验证码至您的邮箱'}
              {step === 3 && '设置您的登录密码'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: 邮箱 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📧</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-dark w-full pl-12"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* 邀请码输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邀请码 <span className="text-gray-500">(可选)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🎁</span>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Za-z0-9]/g, '').slice(0, 12))}
                    className="input-dark w-full pl-12 font-mono"
                    placeholder="输入邀请码 (6-12位)"
                    maxLength={12}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">有邀请码可以享受首月5折优惠</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-dark focus:ring-primary"
                />
                <span className="text-sm text-gray-400">
                  我已阅读并同意
                  <Link href="/terms" className="text-primary hover:underline mx-1">服务条款</Link>
                  和
                  <Link href="/privacy" className="text-primary hover:underline mx-1">隐私政策</Link>
                </span>
              </label>
            </div>
          )}

          {/* Step 2: 验证码 */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="text-4xl mb-4">📬</div>
                <p className="text-gray-400 mb-4">
                  验证码已发送至
                  <span className="text-primary block font-medium">{formData.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  输入验证码
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-dark w-full text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={countdown > 0}
                className="w-full text-primary hover:text-primary/80 text-sm transition-colors disabled:text-gray-500"
              >
                {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送验证码'}
              </button>
            </div>
          )}

          {/* Step 3: 密码设置 */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  您的姓名
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">👤</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-dark w-full pl-12"
                    placeholder="输入您的姓名"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  目标市场
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-dark w-full"
                >
                  <option value="Thailand">泰国 🇹🇭</option>
                  <option value="Vietnam">越南 🇻🇳</option>
                  <option value="Indonesia">印度尼西亚 🇮🇩</option>
                  <option value="Malaysia">马来西亚 🇲🇾</option>
                  <option value="Philippines">菲律宾 🇵🇭</option>
                  <option value="Singapore">新加坡 🇸🇬</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  设置密码
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-dark w-full pl-12"
                    placeholder="至少6位字符"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔐</span>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-dark w-full pl-12"
                    placeholder="再次输入密码"
                  />
                </div>
              </div>

              {/* 密码强度指示 */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= (formData.password.length > 10 ? 3 : formData.password.length > 6 ? 2 : 1)
                            ? 'bg-primary'
                            : 'bg-dark'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    密码强度：
                    {formData.password.length > 10 ? '强' : formData.password.length > 6 ? '中' : '弱'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 按钮 */}
          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleNextStep}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>注册中...</span>
                </>
              ) : (
                step === 3 ? '完成注册' : '下一步'
              )}
            </button>

            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary w-full"
              >
                上一步
              </button>
            )}
          </div>
        </div>

        {/* 登录链接 */}
        <p className="text-center mt-6 text-gray-400">
          已有账户？{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            立即登录
          </Link>
        </p>

        {/* 优惠提示 */}
        <div className="mt-6 text-center">
          <div className="glass-card px-4 py-3 inline-flex items-center gap-2">
            <span className="text-primary">🎁</span>
            <span className="text-sm text-gray-400">
              注册即享 <span className="text-primary font-medium">首月5折</span> 优惠
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
