'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// 模拟爆品数据
const mockHotProducts = [
  {
    id: 1,
    name: '无线蓝牙耳机',
    category: '数码配件',
    country: '泰国',
    rank: 1,
    sales: 125800,
    growth: '+28.5%',
    price: '¥89-159',
    thumbnail: '🎧',
    trend: 'up',
  },
  {
    id: 2,
    name: '迷你便携榨汁杯',
    category: '厨房用品',
    country: '越南',
    rank: 2,
    sales: 98600,
    growth: '+22.3%',
    price: '¥69-99',
    thumbnail: '🥤',
    trend: 'up',
  },
  {
    id: 3,
    name: '智能手表运动版',
    category: '数码配件',
    country: '印尼',
    rank: 3,
    sales: 89200,
    growth: '+35.2%',
    price: '¥199-399',
    thumbnail: '⌚',
    trend: 'up',
  },
  {
    id: 4,
    name: 'LED化妆灯',
    category: '美妆工具',
    country: '马来西亚',
    rank: 4,
    sales: 75600,
    growth: '+18.7%',
    price: '¥49-89',
    thumbnail: '💄',
    trend: 'down',
  },
  {
    id: 5,
    name: '折叠防晒伞',
    category: '户外用品',
    country: '菲律宾',
    rank: 5,
    sales: 68400,
    growth: '+15.2%',
    price: '¥39-69',
    thumbnail: '☂️',
    trend: 'up',
  },
  {
    id: 6,
    name: '多功能收纳盒',
    category: '家居用品',
    country: '泰国',
    rank: 6,
    sales: 62800,
    growth: '+12.8%',
    price: '¥29-59',
    thumbnail: '📦',
    trend: 'down',
  },
  {
    id: 7,
    name: 'USB充电风扇',
    category: '数码配件',
    country: '越南',
    rank: 7,
    sales: 57200,
    growth: '+9.5%',
    price: '¥25-45',
    thumbnail: '🌀',
    trend: 'up',
  },
  {
    id: 8,
    name: '便携式挂烫机',
    category: '家电',
    country: '印尼',
    rank: 8,
    sales: 51600,
    growth: '+21.3%',
    price: '¥129-199',
    thumbnail: '🔥',
    trend: 'up',
  },
  {
    id: 9,
    name: '无线充电器',
    category: '数码配件',
    country: '马来西亚',
    rank: 9,
    sales: 48900,
    growth: '+8.2%',
    price: '¥59-99',
    thumbnail: '🔋',
    trend: 'down',
  },
  {
    id: 10,
    name: '智能体重秤',
    category: '健康用品',
    country: '菲律宾',
    rank: 10,
    sales: 45200,
    growth: '+14.6%',
    price: '¥79-139',
    thumbnail: '⚖️',
    trend: 'up',
  },
]

// 模拟统计数据
const mockStats = {
  totalProducts: 1586,
  todayNew: 42,
  hotCategory: '数码配件',
  avgGrowth: '18.5%',
}

// 分类列表
const categories = ['全部', '数码配件', '厨房用品', '美妆工具', '户外用品', '家居用品', '家电', '健康用品']

// 国家列表
const countries = [
  { code: 'all', name: '全部', flag: '🌏' },
  { code: 'Thailand', name: '泰国', flag: '🇹🇭' },
  { code: 'Vietnam', name: '越南', flag: '🇻🇳' },
  { code: 'Indonesia', name: '印尼', flag: '🇮🇩' },
  { code: 'Malaysia', name: '马来西亚', flag: '🇲🇾' },
  { code: 'Philippines', name: '菲律宾', flag: '🇵🇭' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [sortBy, setSortBy] = useState<'sales' | 'growth'>('sales')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      // 使用演示模式
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  // 过滤和排序产品
  const filteredProducts = mockHotProducts
    .filter((p) => {
      if (selectedCategory !== '全部' && p.category !== selectedCategory) return false
      if (selectedCountry !== 'all' && p.country !== countries.find(c => c.code === selectedCountry)?.name) return false
      if (searchKeyword && !p.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'growth') {
        return parseFloat(b.growth) - parseFloat(a.growth)
      }
      return b.sales - a.sales
    })

  const handleGenerate = (productId: number) => {
    // 跳转到AI选品页面
    router.push(`/ai-select?product=${productId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    )
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
              <span className="text-xs text-gray-500 block">AI跨境新手加速器</span>
            </div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-primary font-medium">
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
            <span className="text-gray-400">欢迎，演示用户</span>
            <Link href="/pricing" className="badge badge-primary">
              免费版
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔥 爆品排行榜</h1>
          <p className="text-gray-400">洞察TikTok Shop东南亚市场热门商品趋势</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">监控商品数</div>
            <div className="text-2xl font-bold gradient-text">{mockStats.totalProducts.toLocaleString()}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">今日新增</div>
            <div className="text-2xl font-bold text-green-400">+{mockStats.todayNew}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">热门类目</div>
            <div className="text-2xl font-bold text-white">{mockStats.hotCategory}</div>
          </div>
          <div className="data-card">
            <div className="text-gray-400 text-sm mb-1">平均增长率</div>
            <div className="text-2xl font-bold text-primary">{mockStats.avgGrowth}</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 搜索 */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索商品名称..."
                  className="input-dark w-full pl-10"
                />
              </div>
            </div>

            {/* 国家筛选 */}
            <div className="flex gap-2">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelectedCountry(c.code)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCountry === c.code
                      ? 'bg-primary text-white'
                      : 'bg-dark text-gray-400 hover:bg-primary/20'
                  }`}
                >
                  {c.flag} {c.name}
                </button>
              ))}
            </div>

            {/* 排序 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'sales' | 'growth')}
              className="input-dark"
            >
              <option value="sales">按销量排序</option>
              <option value="growth">按增长率排序</option>
            </select>
          </div>

          {/* 类目标签 */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary/20 text-primary border border-primary'
                    : 'bg-dark text-gray-400 border border-transparent hover:bg-dark/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 排行榜 */}
        <div className="glass-card overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-dark/50 text-gray-400 text-sm font-medium">
            <div className="col-span-1">排名</div>
            <div className="col-span-4">商品信息</div>
            <div className="col-span-2">类目</div>
            <div className="col-span-2 text-right">销量</div>
            <div className="col-span-2 text-right">增长率</div>
            <div className="col-span-1 text-center">操作</div>
          </div>

          {/* 列表 */}
          <div className="divide-y divide-primary/10">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <p>暂无符合条件的商品</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-primary/5 transition-colors"
                >
                  {/* 排名 */}
                  <div className="col-span-1">
                    <div
                      className={`rank-badge ${
                        product.rank <= 3
                          ? product.rank === 1
                            ? 'rank-1'
                            : product.rank === 2
                            ? 'rank-2'
                            : 'rank-3'
                          : 'rank-default'
                      }`}
                    >
                      {product.rank <= 3 ? (
                        product.rank === 1 ? '🥇' : product.rank === 2 ? '🥈' : '🥉'
                      ) : (
                        product.rank
                      )}
                    </div>
                  </div>

                  {/* 商品信息 */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-dark flex items-center justify-center text-2xl">
                      {product.thumbnail}
                    </div>
                    <div>
                      <div className="text-white font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.price}</div>
                    </div>
                  </div>

                  {/* 类目 */}
                  <div className="col-span-2">
                    <span className="badge badge-primary">{product.category}</span>
                    <div className="text-xs text-gray-500 mt-1">{product.country}</div>
                  </div>

                  {/* 销量 */}
                  <div className="col-span-2 text-right">
                    <div className="text-white font-medium">{product.sales.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">件</div>
                  </div>

                  {/* 增长率 */}
                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        product.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {product.trend === 'up' ? '📈' : '📉'}
                      {product.growth}
                    </span>
                  </div>

                  {/* 操作 */}
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => handleGenerate(product.id)}
                      className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                    >
                      分析
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 分页 */}
        <div className="flex justify-center mt-6 gap-2">
          <button className="px-4 py-2 glass-card text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled>
            上一页
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg">1</button>
          <button className="px-4 py-2 glass-card text-gray-400 hover:text-white transition-colors">2</button>
          <button className="px-4 py-2 glass-card text-gray-400 hover:text-white transition-colors">3</button>
          <button className="px-4 py-2 glass-card text-gray-400 hover:text-white transition-colors">
            下一页
          </button>
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
