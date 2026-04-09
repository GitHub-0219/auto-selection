'use client'

import Link from 'next/link'

const plans = [
  {
    name: '免费版',
    price: '¥0',
    period: '永久免费',
    description: '适合个人体验和学习',
    features: [
      '5次AI选品分析/月',
      '基础商品翻译',
      '1个平台同步',
      '社区支持',
    ],
    notIncluded: [
      '高级数据分析',
      '智能定价建议',
      '优先客户支持',
    ],
    current: false,
    trial: false,
  },
  {
    name: '基础版',
    price: '¥199',
    period: '/月',
    description: '适合个人卖家起步',
    features: [
      '50次AI选品分析/月',
      '无限商品翻译',
      '3个平台同步',
      '基础数据分析',
      '邮件支持',
    ],
    notIncluded: [
      '智能定价建议',
      '优先客户支持',
    ],
    current: false,
    trial: true,
  },
  {
    name: '专业版',
    price: '¥599',
    period: '/月',
    description: '适合成长中的卖家',
    features: [
      '无限AI选品分析',
      '无限商品翻译',
      '全平台同步',
      '高级数据分析',
      '智能定价建议',
      '优先客户支持',
      'API访问权限',
    ],
    notIncluded: [],
    current: false,
    trial: false,
    popular: true,
  },
  {
    name: '企业版',
    price: '¥1999',
    period: '/月',
    description: '适合团队和企业',
    features: [
      '所有专业版功能',
      '多用户协作',
      '定制化报告',
      '专属客户经理',
      '优先技术支持',
      '私有化部署选项',
    ],
    notIncluded: [],
    current: false,
    trial: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            AI跨境新手加速器
          </Link>
          <nav className="flex gap-6">
            <Link href="/#features" className="text-gray-600 hover:text-blue-600">
              功能
            </Link>
            <Link href="/pricing" className="text-blue-600 font-medium">
              定价
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

      {/* Pricing Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择适合您的方案
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            灵活的定价方案，满足不同规模卖家的需求。所有方案均包含14天免费试用。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                  最受欢迎
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>

                <Link
                  href={plan.trial ? '/register' : '/register'}
                  className={`mt-6 block text-center py-3 rounded-lg font-medium transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.trial ? '开始14天试用' : '立即开始'}
                </Link>

                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-gray-700">包含功能:</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center text-sm text-gray-400"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            常见问题
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                免费试用期结束后会自动扣费吗？
              </h3>
              <p className="text-gray-600 text-sm">
                不会。14天免费试用期间无需绑定信用卡，试用结束后您可以选择是否订阅。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                可以随时更换或取消订阅吗？
              </h3>
              <p className="text-gray-600 text-sm">
                可以。您可以随时在账户设置中更换方案或取消订阅，取消后按剩余天数退款。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                多个店铺可以共用一个账号吗？
              </h3>
              <p className="text-gray-600 text-sm">
                可以。专业版及以上支持多店铺管理，企业版还支持多用户协作。
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                如何获取API访问权限？
              </h3>
              <p className="text-gray-600 text-sm">
                专业版及以上用户可以在设置中生成API密钥，用于系统集成开发。
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">AI跨境新手加速器</h3>
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
