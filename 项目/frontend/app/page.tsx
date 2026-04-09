import Link from 'next/link'

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
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
            <Link href="/login" className="text-gray-600 hover:text-blue-600">
              登录
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              免费试用
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4">
        <section className="py-20 text-center">
          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            🚀 新用户首月5折优惠
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI赋能跨境电商
            <br />
            <span className="text-blue-600">让新手快速起步</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            智能选品、自动翻译、多平台运营，一站式跨境电商解决方案
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition"
            >
              立即开始 - 14天免费试用
            </Link>
            <Link
              href="/ai-select"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg hover:bg-gray-50 transition"
            >
              体验AI选品
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">无需信用卡 · 随时取消 · 专属客服支持</p>
        </section>

        {/* Stats */}
        <section className="py-12 bg-white rounded-2xl shadow-lg mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">10,000+</p>
              <p className="text-gray-600 mt-2">活跃卖家</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">50+</p>
              <p className="text-gray-600 mt-2">支持语言</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">100,000+</p>
              <p className="text-gray-600 mt-2">成功选品</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">98%</p>
              <p className="text-gray-600 mt-2">用户满意度</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            核心功能
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            专为跨境电商新手设计的一站式解决方案，帮助您快速开启全球业务
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="🤖 智能选品分析"
              description="基于AI算法分析市场趋势、竞争程度和用户需求，帮你找到高潜力商品"
            />
            <FeatureCard
              title="🌍 一键多语言翻译"
              description="支持50+语言自动翻译，告别语言障碍，让商品轻松进入全球市场"
            />
            <FeatureCard
              title="🔄 多平台同步管理"
              description="Amazon、eBay、Shopify、TikTok Shop一键同步，省时省力"
            />
            <FeatureCard
              title="💰 智能定价策略"
              description="AI自动计算最优定价，考虑成本、竞争对手和目标利润率"
            />
            <FeatureCard
              title="📦 订单自动化处理"
              description="自动处理订单、发货、物流追踪，大幅提升运营效率"
            />
            <FeatureCard
              title="📊 数据分析仪表盘"
              description="实时监控销售数据，追踪关键指标，生成绩效报告"
            />
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-gray-50 rounded-2xl px-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            如何开始
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">注册账号</h3>
              <p className="text-gray-600 text-sm">3分钟完成注册，即刻开始体验</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">连接店铺</h3>
              <p className="text-gray-600 text-sm">一键授权Amazon、eBay等平台</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI智能选品</h3>
              <p className="text-gray-600 text-sm">输入关键词，获取AI推荐</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">开始销售</h3>
              <p className="text-gray-600 text-sm">自动同步订单，轻松运营</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            用户评价
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                ★★★★★
              </div>
              <p className="text-gray-600 mb-4">
                "用了AI选品功能后，第一个月就找到了爆款，销售额突破了10万！"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">张</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">张老板</p>
                  <p className="text-sm text-gray-500">亚马逊卖家</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                ★★★★★
              </div>
              <p className="text-gray-600 mb-4">
                "多语言翻译太方便了，商品自动翻译成英语、日语、德语，节省了大量时间。"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">李</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">李女士</p>
                  <p className="text-sm text-gray-500">eBay卖家</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center gap-1 text-yellow-400 mb-4">
                ★★★★★
              </div>
              <p className="text-gray-600 mb-4">
                "订单自动处理功能太省心了，再也不用手动处理订单了，效率提升10倍！"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">王</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">王先生</p>
                  <p className="text-sm text-gray-500">Shopify卖家</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好开始您的跨境电商之旅了吗？
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            加入10,000+卖家的行列，让AI助您一臂之力
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-50 transition"
          >
            立即开始 - 14天免费试用
          </Link>
        </section>

        {/* Supported Platforms */}
        <section className="py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            支持的平台
          </h2>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {['Amazon', 'eBay', 'Shopify', 'AliExpress', 'TikTok Shop', 'Walmart'].map((platform) => (
              <div
                key={platform}
                className="px-6 py-3 bg-white rounded-lg shadow-sm text-gray-700 font-medium"
              >
                {platform}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">AI跨境新手加速器</h3>
              <p className="text-gray-400 text-sm">
                让跨境电商变得更简单
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/#features">功能介绍</Link></li>
                <li><Link href="/pricing">定价方案</Link></li>
                <li><Link href="/ai-select">AI选品</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#">帮助中心</Link></li>
                <li><Link href="#">使用文档</Link></li>
                <li><Link href="#">联系我们</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">法律</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#">服务条款</Link></li>
                <li><Link href="#">隐私政策</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 AI跨境新手加速器. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
