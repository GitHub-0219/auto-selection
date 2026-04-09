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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AI跨境新手加速器
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className={currentPage === 'dashboard' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}>
              用户中心
            </Link>
            <Link href="/ai-select" className={currentPage === 'ai-select' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}>
              AI选品
            </Link>
            <Link href="/pricing" className={currentPage === 'pricing' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'}>
              定价
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-600">欢迎，{userName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600">
                  登录
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">
          AI跨境新手加速器
        </div>
        <nav className="flex gap-6">
          <Link href="/#features" className="text-gray-600 hover:text-blue-600">
            功能
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
            定价
          </Link>
          <Link href="/ai-select" className="text-gray-600 hover:text-blue-600">
            AI选品
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-blue-600 font-medium">
              用户中心
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600">
                登录
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                免费试用
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
