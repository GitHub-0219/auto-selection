'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then((data) => {
        setUser(data.data)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('token')
        router.push('/login')
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AI跨境新手加速器
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              欢迎，{user?.name || '用户'}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {user?.role === 'free' ? '免费版' : user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">用户中心</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">姓名</label>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">邮箱</label>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">会员等级</label>
                <p className="font-medium text-gray-900">
                  {user?.role === 'free'
                    ? '免费版'
                    : user?.role === 'basic'
                    ? '基础版'
                    : user?.role === 'pro'
                    ? '专业版'
                    : '企业版'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">注册时间</label>
                <p className="font-medium text-gray-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('zh-CN')
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
            <div className="space-y-3">
              <Link
                href="/ai-select"
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
              >
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium text-gray-900">AI智能选品</p>
                  <p className="text-sm text-gray-500">发现高潜力商品</p>
                </div>
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition"
              >
                <span className="text-2xl">💎</span>
                <div>
                  <p className="font-medium text-gray-900">升级会员</p>
                  <p className="text-sm text-gray-500">解锁更多功能</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">使用统计</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">本月选品次数</p>
                  <p className="text-xl font-bold text-gray-900">3/5</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">翻译次数</p>
                  <p className="text-xl font-bold text-gray-900">12/无限</p>
                </div>
                <span className="text-2xl">🌍</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">最近活动</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border-b">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">完成AI选品分析</p>
                <p className="text-sm text-gray-500">分析了"蓝牙耳机"、"智能手表"等关键词</p>
              </div>
              <span className="text-sm text-gray-400">2小时前</span>
            </div>
            <div className="flex items-center gap-4 p-4 border-b">
              <span className="text-2xl">🌍</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">完成商品翻译</p>
                <p className="text-sm text-gray-500">将"无线蓝牙耳机"翻译为英语、日语</p>
              </div>
              <span className="text-sm text-gray-400">5小时前</span>
            </div>
            <div className="flex items-center gap-4 p-4">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">注册成功</p>
                <p className="text-sm text-gray-500">欢迎加入AI跨境新手加速器</p>
              </div>
              <span className="text-sm text-gray-400">1天前</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
