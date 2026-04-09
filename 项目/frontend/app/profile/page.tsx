'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 模拟用户数据
const mockUser = {
  id: 1,
  name: '演示用户',
  email: 'demo@example.com',
  avatar: '👤',
  plan: 'free',
  planExpireDate: null,
  stats: {
    totalAnalysis: 5,
    todayAnalysis: 3,
    invitesCount: 0,
    rewardBalance: 0,
  },
}

// 模拟邀请数据
const mockInviteData = {
  inviteCode: 'ABCD1234',
  inviteLink: 'https://autoselect.com/register?invite=ABCD1234',
  inviteHistory: [],
  leaderboard: [
    { rank: 1, name: '用户A', invites: 156, reward: 1560 },
    { rank: 2, name: '用户B', invites: 142, reward: 1420 },
    { rank: 3, name: '用户C', invites: 128, reward: 1280 },
  ],
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'invite'>('overview')
  const [user, setUser] = useState(mockUser)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser({
          ...mockUser,
          name: userData.name || mockUser.name,
          email: userData.email || mockUser.email,
          plan: userData.plan || mockUser.plan,
        })
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }

    setLoading(false)
  }, [router])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mockInviteData.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败', e)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Auto选品 - AI跨境新手加速器',
          text: '我用Auto选品找到了很多爆品，推荐给你！',
          url: mockInviteData.inviteLink,
        })
      } catch (e) {
        // 用户取消分享时不报错
      }
    } else {
      handleCopyLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
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
            <Link href="/pricing" className="text-gray-400 hover:text-primary transition-colors">
              定价方案
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">{user.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 用户信息卡片 */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
              {user.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-gray-400 mb-4">{user.email}</p>
              <div className="flex items-center gap-3">
                <span className="badge badge-primary">
                  {user.plan === 'free' ? '免费版' : user.plan === 'pro' ? '专业版' : '企业版'}
                </span>
                {user.plan === 'free' && (
                  <Link href="/pricing" className="text-sm text-primary hover:underline">
                    升级到专业版
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">总分析次数</div>
            <div className="text-2xl font-bold gradient-text">{user.stats.totalAnalysis}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">今日分析</div>
            <div className="text-2xl font-bold text-white">{user.stats.todayAnalysis}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">邀请人数</div>
            <div className="text-2xl font-bold text-white">{user.stats.invitesCount}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">奖励余额</div>
            <div className="text-2xl font-bold text-green-400">¥{user.stats.rewardBalance}</div>
          </div>
        </div>

        {/* 选项卡 */}
        <div className="glass-card mb-8">
          <div className="flex gap-2 p-2 border-b border-primary/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              订阅管理
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'invite'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              邀请奖励
            </button>
          </div>

          {/* 概览内容 */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">使用概览</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">今日配额</span>
                      <span className="text-white font-medium">{user.stats.todayAnalysis}/5</span>
                    </div>
                    <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min((user.stats.todayAnalysis / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-dark/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">账号状态</span>
                      <span className="text-green-400 font-medium">正常</span>
                    </div>
                    <div className="text-sm text-gray-500">最后登录: 刚刚</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">快捷操作</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/ai-select" className="bg-primary/20 p-4 rounded-lg text-center hover:bg-primary/30 transition-colors">
                    <div className="text-3xl mb-2">🤖</div>
                    <div className="text-white font-medium">AI选品</div>
                  </Link>
                  <Link href="/dashboard" className="bg-primary/20 p-4 rounded-lg text-center hover:bg-primary/30 transition-colors">
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="text-white font-medium">爆品排行</div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 订阅管理内容 */}
          {activeTab === 'subscription' && (
            <div className="p-6 space-y-6">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary">ℹ️</span>
                  <span className="text-white font-medium">
                    当前套餐：{user.plan === 'free' ? '免费版' : user.plan === 'pro' ? '专业版' : '企业版'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {user.plan === 'free' 
                    ? '升级到专业版，解锁无限次AI分析、深度市场分析等功能。' 
                    : `您的订阅将持续有效`
                  }
                </p>
              </div>

              {user.plan === 'free' ? (
                <Link href="/pricing" className="btn-primary block text-center">
                  立即升级
                </Link>
              ) : (
                <div className="space-y-4">
                  <button className="btn-secondary w-full">
                    查看订阅历史
                  </button>
                  <button className="w-full py-3 bg-dark border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                    取消订阅
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 邀请奖励内容 */}
          {activeTab === 'invite' && (
            <div className="p-6 space-y-6">
              <div className="bg-dark/50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-4">🎁 邀请好友</h3>
                <p className="text-gray-400 mb-4">
                  每成功邀请一位好友注册，双方都可获得免费延长7天专业版！
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">您的邀请码</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mockInviteData.inviteCode}
                        readOnly
                        className="input-dark flex-1 text-center font-mono text-lg"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mockInviteData.inviteCode)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="btn-secondary px-4"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">邀请链接</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mockInviteData.inviteLink}
                        readOnly
                        className="input-dark flex-1 text-sm"
                      />
                      <button onClick={handleCopyLink} className="btn-secondary px-4">
                        {copied ? '已复制' : '复制链接'}
                      </button>
                    </div>
                  </div>

                  <button onClick={handleShare} className="btn-primary w-full flex items-center justify-center gap-2">
                    <span>📤</span>
                    <span>分享给好友</span>
                  </button>
                </div>
              </div>

              {/* 邀请排行榜 */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">🏆 邀请排行榜</h3>
                <div className="bg-dark/50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm">
                        <th className="px-4 py-3">排名</th>
                        <th className="px-4 py-3">用户</th>
                        <th className="px-4 py-3 text-right">邀请数</th>
                        <th className="px-4 py-3 text-right">奖励</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {mockInviteData.leaderboard.map((item) => (
                        <tr key={item.rank} className="hover:bg-primary/5">
                          <td className="px-4 py-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                item.rank === 1
                                  ? 'bg-yellow-500 text-black'
                                  : item.rank === 2
                                  ? 'bg-gray-400 text-black'
                                  : item.rank === 3
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-primary/20 text-primary'
                              }`}
                            >
                              {item.rank}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{item.name}</td>
                          <td className="px-4 py-3 text-right text-white font-medium">{item.invites}</td>
                          <td className="px-4 py-3 text-right text-green-400">¥{item.reward}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2024 Auto选品 · AI跨境新手加速器
        </div>
      </footer>
    </div>
  )
}
