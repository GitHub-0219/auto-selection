'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface HeaderProps {
  showNav?: boolean
  currentPage?: string
}

export default function Header({ showNav = false, currentPage = '' }: HeaderProps) {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      setIsLoggedIn(true)
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || '用户')
      } catch (e) {
        // ignore parse error
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (showNav) {
    return (
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
            <Link 
              href="/dashboard" 
              className={currentPage === 'dashboard' ? 'text-primary font-medium' : 'text-gray-400 hover:text-primary transition-colors'}
            >
              爆品分析
            </Link>
            <Link 
              href="/ai-select" 
              className={currentPage === 'ai-select' ? 'text-primary font-medium' : 'text-gray-400 hover:text-primary transition-colors'}
            >
              AI选品
            </Link>
            <Link 
              href="/pricing" 
              className={currentPage === 'pricing' ? 'text-primary font-medium' : 'text-gray-400 hover:text-primary transition-colors'}
            >
              定价方案
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-400">欢迎，{userName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="btn-primary"
                >
                  免费试用
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    )
  }

  return (
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
        <nav className="hidden md:flex gap-6">
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
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="text-gray-400 hidden sm:inline">欢迎，{userName}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors text-sm"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                免费试用
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
