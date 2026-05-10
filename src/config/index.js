/**
 * 应用配置文件
 * 集中管理所有配置项
 */

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // 数据库配置（MongoDB）
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auto-selection',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // AI服务配置
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: 2000,
  },

  // TikTok Shop 目标市场配置
  markets: [
    { code: 'TH', name: '泰国', currency: 'THB', symbol: '฿', population: '7000万' },
    { code: 'VN', name: '越南', currency: 'VND', symbol: '₫', population: '1亿' },
    { code: 'MY', name: '马来西亚', currency: 'MYR', symbol: 'RM', population: '3300万' },
    { code: 'PH', name: '菲律宾', currency: 'PHP', symbol: '₱', population: '1.1亿' },
    { code: 'ID', name: '印尼', currency: 'IDR', symbol: 'Rp', population: '2.7亿' },
  ],

  // 选品评分维度权重
  scoring: {
    weights: {
      trend: 0.25,       // 趋势热度
      competition: 0.20, // 竞争度
      profit: 0.25,      // 利润空间
      demand: 0.20,      // 需求量
      supply: 0.10,      // 供应链难度
    },
    maxScore: 100,
  },

  // 热门品类配置
  hotCategories: [
    '美妆护肤', '时尚服饰', '3C数码', '家居生活',
    '母婴用品', '食品保健', '运动户外', '宠物用品',
  ],
};

module.exports = config;
