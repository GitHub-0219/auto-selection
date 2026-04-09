'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// 模拟AI分析结果
const mockAnalysisResult = {
  score: 85,
  recommendation: '强烈推荐',
  marketSize: '50万+',
  competition: '中等',
  trend: '上升',
  bestMarkets: ['泰国', '越南', '马来西亚'],
  optimalPrice: '¥89-129',
  keywords: ['蓝牙耳机', '无线耳机', '运动耳机', '降噪耳机'],
  analysis: {
    pros: [
      '市场需求持续增长，过去30天搜索量上涨35%',
      '竞争程度适中，新卖家有机会切入',
      '利润空间充足，预估利润率35-45%',
      '适合短视频推广，转化率高',
    ],
    cons: [
      '需要一定的库存准备',
      '物流成本相对较高',
      '品牌竞争逐渐激烈',
    ],
  },
  similarProducts: [
    { name: 'AirPods Pro 2', price: '¥199', sales: '2.3万+' },
    { name: '漫步者蓝牙耳机', price: '¥129', sales: '1.8万+' },
    { name: 'QCY T13', price: '¥89', sales: '1.5万+' },
  ],
}

// 分析建议
const analysisTips = [
  '输入具体的产品关键词，如"蓝牙耳机"',
  '多个关键词用逗号分隔，可获得更全面的分析',
  '建议选择竞争程度适中的细分市场切入',
]

export default function AISelectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<typeof mockAnalysisResult | null>(null)
  const [keywords, setKeywords] = useState('')
  const [error, setError] = useState('')
  const [analysisType, setAnalysisType] = useState<'quick' | 'deep'>('quick')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([])
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    // 演示模式下直接通过
    setIsAuthenticated(true)
    
    // 如果从爆品页面跳转过来，自动填充
    const productId = searchParams.get('product')
    if (productId) {
      setKeywords('蓝牙耳机')
      // 自动开始分析
      setTimeout(() => handleAnalyze({ preventDefault: () => {} } as any), 500)
    }
  }, [searchParams])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keywords.trim()) {
      setError('请输入商品关键词')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    // 添加到聊天历史
    setChatHistory(prev => [...prev, { role: 'user', content: keywords }])

    try {
      // TODO: 调用后端AI分析API
      // const response = await fetch('/api/ai/analyze', {...})
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 模拟返回结果
      setResults(mockAnalysisResult)
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: `已完成对"${keywords}"的分析，综合评分85分，建议上架销售。` 
      }])
      
      // 滚动到结果
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err: any) {
      setError(err.message || '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // TODO: 实现导出功能
    alert('导出功能开发中...')
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">请先登录</h1>
          <Link href="/login" className="btn-primary">
            去登录
          </Link>
        </div>
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
            <Link href="/ai-select" className="text-primary font-medium">
              AI选品
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-primary transition-colors">
              定价方案
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">欢迎，演示用户</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🤖 AI智能选品分析</h1>
          <p className="text-gray-400">输入商品关键词，AI将分析市场趋势、竞争程度和潜力指数</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：分析表单 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 分析类型选择 */}
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-3">分析模式</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAnalysisType('quick')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    analysisType === 'quick'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-400 hover:bg-primary/20'
                  }`}
                >
                  <div className="text-lg mb-1">⚡</div>
                  <div className="text-sm font-medium">快速分析</div>
                  <div className="text-xs opacity-70">30秒内完成</div>
                </button>
                <button
                  onClick={() => setAnalysisType('deep')}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    analysisType === 'deep'
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-400 hover:bg-primary/20'
                  }`}
                >
                  <div className="text-lg mb-1">🎯</div>
                  <div className="text-sm font-medium">深度分析</div>
                  <div className="text-xs opacity-70">2-3分钟完成</div>
                </button>
              </div>
            </div>

            {/* 输入表单 */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">输入关键词</h3>
              <form onSubmit={handleAnalyze}>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例如: 蓝牙耳机, 智能手表&#10;多个关键词用逗号分隔"
                  className="input-dark w-full h-32 resize-none mb-4"
                />
                
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>AI分析中...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>开始分析</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 分析提示 */}
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-3">💡 分析技巧</div>
              <ul className="space-y-2">
                {analysisTips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-500 flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 右侧：分析结果 */}
          <div className="lg:col-span-2" ref={resultRef}>
            {loading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">🤖</span>
                  </div>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">AI正在分析中...</h3>
                <p className="text-gray-400 mb-4">
                  正在分析市场趋势、竞争程度、利润空间等关键指标
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* 综合评分 */}
                <div className="glass-card p-6 animate-pulse-glow">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-sm text-gray-400">综合评分</div>
                      <div className="text-5xl font-bold gradient-text">{results.score}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      results.recommendation === '强烈推荐' 
                        ? 'bg-green-500/20 text-green-400'
                        : results.recommendation === '推荐'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {results.recommendation}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-dark/50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-400">市场规模</div>
                      <div className="text-xl font-bold text-white">{results.marketSize}</div>
                    </div>
                    <div className="bg-dark/50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-400">竞争程度</div>
                      <div className="text-xl font-bold text-white">{results.competition}</div>
                    </div>
                    <div className="bg-dark/50 p-4 rounded-lg text-center">
                      <div className="text-sm text-gray-400">趋势</div>
                      <div className="text-xl font-bold text-green-400">{results.trend}</div>
                    </div>
                  </div>
                </div>

                {/* 优劣势分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-green-400">✓</span>
                      <h3 className="text-lg font-medium text-white">优势分析</h3>
                    </div>
                    <ul className="space-y-3">
                      {results.analysis.pros.map((pro, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span className="text-gray-300 text-sm">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-yellow-400">!</span>
                      <h3 className="text-lg font-medium text-white">注意事项</h3>
                    </div>
                    <ul className="space-y-3">
                      {results.analysis.cons.map((con, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-yellow-400 mt-0.5">!</span>
                          <span className="text-gray-300 text-sm">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 推荐市场 */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-medium text-white mb-4">🎯 推荐市场</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {results.bestMarkets.map((market, i) => (
                      <span key={i} className="px-4 py-2 bg-primary/20 text-primary rounded-lg">
                        {market === '泰国' ? '🇹🇭' : market === '越南' ? '🇻🇳' : '🇲🇾'} {market}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">建议价格区间</div>
                      <div className="text-xl font-bold gradient-text">{results.optimalPrice}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">高热度关键词</div>
                      <div className="flex flex-wrap gap-2">
                        {results.keywords.map((kw, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(kw)}
                            className="px-2 py-1 bg-dark text-gray-400 rounded text-xs hover:text-primary transition-colors"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 相似爆品 */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-medium text-white mb-4">📊 相似爆品参考</h3>
                  <div className="space-y-3">
                    {results.similarProducts.map((product, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-dark/50 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.price}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">{product.sales}</div>
                          <div className="text-xs text-gray-500">月销</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4">
                  <button onClick={handleExport} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <span>📥</span>
                    <span>导出分析报告</span>
                  </button>
                  <button onClick={() => setKeywords('')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <span>🔄</span>
                    <span>继续分析</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-6">🤖</div>
                <h3 className="text-xl font-medium text-white mb-2">AI选品助手</h3>
                <p className="text-gray-400 mb-6">
                  输入您感兴趣的商品关键词<br />
                  AI将为您分析市场趋势、竞争程度和潜力指数
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <span className="text-primary">💡</span>
                  <span className="text-sm text-gray-400">提示：结合爆品排行榜一起使用效果更佳</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/20 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2024 Auto选品 · AI跨境新手加速器
        </div>
      </footer>
    </div>
  )
}
