/**
 * Mock API Server for Demo
 * This file provides mock API responses for demonstration purposes
 * Run with: node mock-server.js
 */

const http = require('http')
const crypto = require('crypto')

const PORT = 3001

// Mock data storage
const mockUsers = new Map()
const mockProducts = [
  { id: '1', name: '无线蓝牙耳机', price: 29.99, category: '电子产品', stock: 100, sales: 520 },
  { id: '2', name: '智能手表', price: 49.99, category: '电子产品', stock: 80, sales: 380 },
  { id: '3', name: '便携充电宝', price: 19.99, category: '配件', stock: 200, sales: 890 },
  { id: '4', name: '无线充电器', price: 15.99, category: '配件', stock: 150, sales: 420 },
  { id: '5', name: '蓝牙音箱', price: 35.99, category: '电子产品', stock: 90, sales: 310 },
  { id: '6', name: '手机壳', price: 9.99, category: '配件', stock: 500, sales: 1200 },
]

// Market insights mock data
const marketInsights = [
  { region: '北美', growth: '+45%', topCategories: ['电子产品', '家居', '美妆'] },
  { region: '欧洲', growth: '+32%', topCategories: ['时尚', '家居', '运动'] },
  { region: '东南亚', growth: '+68%', topCategories: ['美妆', '服饰', '食品'] },
  { region: '日本', growth: '+28%', topCategories: ['电子产品', '母婴', '食品'] },
]

// Translation mock data
const translationSamples = {
  en: { name: 'English', samples: ['Wireless Bluetooth Earbuds', 'Smart Watch', 'Portable Charger'] },
  ja: { name: '日本語', samples: ['ワイヤレスBluetoothイヤホン', 'スマートウォッチ', 'ポータブル充電器'] },
  ko: { name: '한국어', samples: ['무선 블루투스 이어폰', '스마트워치', '휴대용 충전기'] },
  de: { name: 'Deutsch', samples: ['Kabellose Bluetooth-Ohrhörer', 'Smartwatch', 'Tragbares Ladegerät'] },
  fr: { name: 'Français', samples: ['Écouteurs Bluetooth sans fil', 'Montre intelligente', 'Chargeur portable'] },
  es: { name: 'Español', samples: ['Auriculares Bluetooth inalámbricos', 'Reloj inteligente', 'Cargador portátil'] },
}

// Helper functions
const generateToken = (userId, email) => {
  return `mock_token_${Buffer.from(JSON.stringify({ sub: userId, email, iat: Date.now() })).toString('base64')}`
}

const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

const getAuthUser = (req) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  if (!token.startsWith('mock_token_')) return null
  try {
    const payload = JSON.parse(Buffer.from(token.slice(11), 'base64').toString())
    return mockUsers.get(payload.sub) || null
  } catch {
    return null
  }
}

// Request handler
const handler = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname.replace('/api', '')
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  try {
    // Health check
    if (path === '/health' || path === '/') {
      sendJSON(res, 200, {
        success: true,
        message: 'AI跨境新手加速器 API 服务运行正常',
        data: {
          version: '1.0.0',
          status: 'running',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected (mock)',
            api: 'operational',
          },
        },
      })
      return
    }

    // Auth routes
    if (path === '/auth/register' && req.method === 'POST') {
      const body = await parseBody(req)
      const { name, email, password } = body

      if (!name || !email || !password) {
        return sendJSON(res, 400, { success: false, message: '缺少必填字段' })
      }

      if (password.length < 8) {
        return sendJSON(res, 400, { success: false, message: '密码至少8个字符' })
      }

      // Check existing user
      for (const user of mockUsers.values()) {
        if (user.email === email) {
          return sendJSON(res, 400, { success: false, message: '该邮箱已被注册' })
        }
      }

      const userId = crypto.randomUUID()
      const user = { id: userId, name, email, role: 'free', createdAt: new Date().toISOString() }
      mockUsers.set(userId, { ...user, password })

      const token = generateToken(userId, email)
      sendJSON(res, 201, {
        success: true,
        message: '注册成功',
        data: { user, accessToken: token },
      })
      return
    }

    if (path === '/auth/login' && req.method === 'POST') {
      const body = await parseBody(req)
      const { email, password } = body

      let foundUser = null
      for (const user of mockUsers.values()) {
        if (user.email === email) {
          foundUser = user
          break
        }
      }

      if (!foundUser) {
        // For demo: allow any email with password 'demo123'
        const userId = crypto.randomUUID()
        const user = { id: userId, name: email.split('@')[0], email, role: 'free', createdAt: new Date().toISOString() }
        mockUsers.set(userId, { ...user, password: 'demo123' })
        const token = generateToken(userId, email)
        return sendJSON(res, 200, {
          success: true,
          message: '登录成功',
          data: { user, accessToken: token },
        })
      }

      if (foundUser.password !== password) {
        return sendJSON(res, 401, { success: false, message: '用户不存在或密码错误' })
      }

      const token = generateToken(foundUser.id, foundUser.email)
      const { password: _, ...userWithoutPassword } = foundUser
      sendJSON(res, 200, {
        success: true,
        message: '登录成功',
        data: { user: userWithoutPassword, accessToken: token },
      })
      return
    }

    // Protected routes
    const user = getAuthUser(req)

    if (path === '/auth/profile' && req.method === 'GET') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const { password: _, ...userWithoutPassword } = user
      sendJSON(res, 200, { success: true, data: userWithoutPassword })
      return
    }

    if (path === '/auth/membership' && req.method === 'GET') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const features = user.role === 'pro' 
        ? ['无限AI选品分析', '无限商品翻译', '全平台同步', '高级数据分析']
        : ['5次AI选品分析/月', '基础商品翻译', '1个平台同步']
      sendJSON(res, 200, {
        success: true,
        data: { plan: user.role, status: 'active', features },
      })
      return
    }

    // AI routes
    if (path === '/ai/analyze-products' && req.method === 'POST') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const body = await parseBody(req)
      const keywords = body.keywords || []

      sendJSON(res, 200, {
        success: true,
        data: {
          recommended: [
            { name: '无线蓝牙耳机', score: 95, trend: '上升', competition: '中' },
            { name: '智能手表', score: 88, trend: '稳定', competition: '高' },
            { name: '便携充电宝', score: 82, trend: '上升', competition: '中' },
            { name: '无线充电器', score: 78, trend: '上升', competition: '低' },
          ],
          insights: [
            `分析关键词: ${keywords.join(', ') || '未指定'}`,
            '无线蓝牙耳机在北美市场增长迅速，同比增长45%',
            '智能手表需求稳定，但竞争激烈，建议差异化选品',
            '便携充电宝是跨境爆款品类，物流成本低，利润率高',
          ],
        },
      })
      return
    }

    if (path === '/ai/translate' && req.method === 'POST') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const body = await parseBody(req)
      const { content, targetLang } = body

      const translations = {
        en: `English: ${content}`,
        ja: `日本語: ${content}`,
        ko: `한국어: ${content}`,
        de: `Deutsch: ${content}`,
        fr: `Français: ${content}`,
      }

      sendJSON(res, 200, {
        success: true,
        data: {
          original: content,
          translated: translations[targetLang] || content,
          targetLang,
        },
      })
      return
    }

    if (path === '/ai/suggest-price' && req.method === 'POST') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const body = await parseBody(req)
      const { cost, targetMarket } = body

      const rates = { '北美': 1.8, '欧洲': 1.9, '东南亚': 1.5, '日本': 1.7 }
      const rate = rates[targetMarket] || 1.6
      const suggestedPrice = cost * rate

      sendJSON(res, 200, {
        success: true,
        data: {
          costPrice: cost,
          targetMarket,
          suggestedPrice: Math.round(suggestedPrice * 100) / 100,
          profit: Math.round((suggestedPrice - cost) * 100) / 100,
          margin: `${Math.round((1 - 1/rate) * 100)}%`,
        },
      })
      return
    }

    if (path === '/ai/capabilities' && req.method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: {
          features: [
            { name: '智能选品分析', endpoint: '/ai/analyze-products', description: '分析市场趋势，推荐高潜力商品' },
            { name: '商品翻译', endpoint: '/ai/translate', description: '支持50+语言翻译' },
            { name: '智能定价', endpoint: '/ai/suggest-price', description: 'AI驱动的动态定价' },
          ],
        },
      })
      return
    }

    // Products routes
    if (path === '/products' && req.method === 'GET') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const page = parseInt(url.searchParams.get('page') || '1')
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
      const start = (page - 1) * pageSize
      const items = mockProducts.slice(start, start + pageSize)
      sendJSON(res, 200, {
        success: true,
        data: {
          items,
          total: mockProducts.length,
          page,
          pageSize,
          totalPages: Math.ceil(mockProducts.length / pageSize),
        },
      })
      return
    }

    // Get single product
    if (path.match(/^\/products\/[^/]+$/) && req.method === 'GET') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      const id = path.split('/')[2]
      const product = mockProducts.find(p => p.id === id)
      if (!product) return sendJSON(res, 404, { success: false, message: '商品不存在' })
      sendJSON(res, 200, { success: true, data: product })
      return
    }

    // Market insights
    if (path === '/ai/market-insights' && req.method === 'GET') {
      if (!user) return sendJSON(res, 401, { success: false, message: '未授权' })
      sendJSON(res, 200, {
        success: true,
        data: {
          insights: marketInsights,
          trends: [
            { keyword: '蓝牙耳机', trend: '上升', weeklyGrowth: '+15%' },
            { keyword: '智能穿戴', trend: '稳定', weeklyGrowth: '+3%' },
            { keyword: '移动电源', trend: '上升', weeklyGrowth: '+22%' },
          ],
        },
      })
      return
    }

    // Supported languages
    if (path === '/ai/languages' && req.method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: {
          languages: Object.entries(translationSamples).map(([code, info]) => ({
            code,
            name: info.name,
          })),
        },
      })
      return
    }

    // 404
    sendJSON(res, 404, { success: false, message: '接口不存在' })

  } catch (error) {
    console.error('Error:', error)
    sendJSON(res, 500, { success: false, message: '服务器错误' })
  }
}

// Start server
const server = http.createServer(handler)
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🚀 AI跨境新手加速器 - Mock API Server                  ║
║                                                           ║
║     服务地址: http://localhost:${PORT}                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`)
  console.log('📋 可用接口:')
  console.log('   GET  /api/health              - 健康检查')
  console.log('   POST /api/auth/register       - 用户注册')
  console.log('   POST /api/auth/login          - 用户登录')
  console.log('   GET  /api/auth/profile        - 获取用户资料 (需认证)')
  console.log('   GET  /api/auth/membership     - 获取会员信息 (需认证)')
  console.log('   POST /api/ai/analyze-products - AI选品分析 (需认证)')
  console.log('   POST /api/ai/translate        - 商品翻译 (需认证)')
  console.log('   POST /api/ai/suggest-price    - 智能定价 (需认证)')
  console.log('   GET  /api/ai/capabilities     - AI能力列表')
  console.log('   GET  /api/ai/market-insights  - 市场洞察 (需认证)')
  console.log('   GET  /api/ai/languages        - 支持的语言')
  console.log('   GET  /api/products            - 商品列表 (需认证)')
  console.log('   GET  /api/products/:id        - 商品详情 (需认证)')
  console.log('\n💡 演示账号: 任意邮箱 + 密码 "demo123"\n')
})
