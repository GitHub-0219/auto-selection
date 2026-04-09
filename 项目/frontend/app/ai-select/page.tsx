'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AISelectPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [keywords, setKeywords] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keywords.trim()) return

    setLoading(true)
    setError('')
    setResults(null)

    const token = localStorage.getItem('token')
    const keywordList = keywords.split(',').map((k) => k.trim()).filter(Boolean)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/analyze-products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ keywords: keywordList }),
        }
      )

      if (!response.ok) {
        throw new Error('分析失败')
      }

      const data = await response.json()
      setResults(data.data)
    } catch (err: any) {
      setError(err.message || '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">验证中...</p>
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
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
              用户中心
            </Link>
            <Link href="/ai-select" className="text-blue-600 font-medium">
              AI选品
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
              定价
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🤖 AI智能选品分析
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            输入您感兴趣的商品关键词，AI将分析市场趋势、竞争程度和潜力指数，
            为您推荐最适合跨境销售的商品。
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleAnalyze}>
            <div className="mb-6">
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                输入商品关键词（多个关键词用逗号分隔）
              </label>
              <input
                type="text"
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="例如: 蓝牙耳机, 智能手表, 充电宝"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {error && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !keywords.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  AI分析中，请稍候...
                </span>
              ) : (
                '开始分析'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Recommended Products */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                📊 推荐商品
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {results.recommended?.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{product.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.trend === '上升'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.trend}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">潜力指数</span>
                        <span className="font-bold text-blue-600">{product.score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${product.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">竞争程度</span>
                        <span
                          className={`font-medium ${
                            product.competition === '高'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {product.competition}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                💡 市场洞察
              </h2>
              <div className="space-y-4">
                {results.insights?.map((insight: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg"
                  >
                    <span className="text-2xl">💡</span>
                    <p className="text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setResults(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                重新分析
              </button>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                升级获取更多分析次数
              </Link>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            💡 选品技巧
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>选择体积小、重量轻的商品可以降低物流成本</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>避免侵权商品，注意目标市场的法规要求</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>选择有稳定供应链的商品，确保库存充足</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 mt-1">•</span>
              <span>分析同类商品的review数量和评分，寻找改进空间</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
