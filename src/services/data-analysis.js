/**
 * 数据分析服务
 * 提供市场趋势、品类排行、竞品分析等数据
 */

const config = require('../config');

const dataAnalysis = {
  /**
   * 获取数据看板概览
   */
  getDashboardData() {
    return {
      // 核心指标
      overview: {
        totalProducts: 156,
        recommendedProducts: 42,
        avgScore: 76,
        activeMarkets: 5,
      },
      // 市场概览
      marketOverview: [
        { market: '泰国', code: 'TH', products: 38, avgScore: 78, trend: '+12%' },
        { market: '越南', code: 'VN', products: 35, avgScore: 75, trend: '+18%' },
        { market: '马来西亚', code: 'MY', products: 28, avgScore: 80, trend: '+8%' },
        { market: '菲律宾', code: 'PH', products: 30, avgScore: 73, trend: '+22%' },
        { market: '印尼', code: 'ID', products: 25, avgScore: 74, trend: '+15%' },
      ],
      // 热门品类
      hotCategories: [
        { name: '美妆护肤', growth: '+25%', products: 32, avgScore: 79 },
        { name: '3C数码', growth: '+20%', products: 28, avgScore: 76 },
        { name: '时尚服饰', growth: '+15%', products: 35, avgScore: 74 },
        { name: '家居生活', growth: '+18%', products: 22, avgScore: 77 },
        { name: '运动户外', growth: '+30%', products: 18, avgScore: 82 },
        { name: '母婴用品', growth: '+12%', products: 21, avgScore: 75 },
      ],
      // 最近7天趋势数据（用于图表）
      weeklyTrend: [
        { date: '05-04', score: 72, products: 145 },
        { date: '05-05', score: 74, products: 148 },
        { date: '05-06', score: 73, products: 150 },
        { date: '05-07', score: 76, products: 152 },
        { date: '05-08', score: 75, products: 153 },
        { date: '05-09', score: 77, products: 155 },
        { date: '05-10', score: 76, products: 156 },
      ],
    };
  },

  /**
   * 获取市场趋势数据
   * @param {string} market - 市场代码
   * @param {string} period - 时间周期
   */
  getMarketTrends(market = 'all', period = '7d') {
    const trends = {
      TH: { name: '泰国', topCategories: ['美妆护肤', '时尚服饰', '食品保健'], growth: '+12%', hotKeywords: ['防晒', '美白', '减肥'] },
      VN: { name: '越南', topCategories: ['3C数码', '家居生活', '时尚服饰'], growth: '+18%', hotKeywords: ['手机壳', '耳机', '收纳'] },
      MY: { name: '马来西亚', topCategories: ['美妆护肤', '母婴用品', '运动户外'], growth: '+8%', hotKeywords: ['护肤', '婴儿', '瑜伽'] },
      PH: { name: '菲律宾', topCategories: ['3C数码', '时尚服饰', '家居生活'], growth: '+22%', hotKeywords: ['手机配件', 'T恤', '厨具'] },
      ID: { name: '印尼', topCategories: ['美妆护肤', '时尚服饰', '食品保健'], growth: '+15%', hotKeywords: ['面膜', '头巾', '零食'] },
    };

    if (market === 'all') return trends;
    return trends[market] || { message: '暂无该市场数据' };
  },

  /**
   * 获取品类热度排行
   */
  getCategoryRanking() {
    return [
      { rank: 1, name: '美妆护肤', heat: 95, growth: '+25%', competition: '中', profitMargin: '45-65%' },
      { rank: 2, name: '运动户外', heat: 90, growth: '+30%', competition: '低', profitMargin: '50-70%' },
      { rank: 3, name: '3C数码', heat: 88, growth: '+20%', competition: '高', profitMargin: '30-50%' },
      { rank: 4, name: '家居生活', heat: 85, growth: '+18%', competition: '中', profitMargin: '40-60%' },
      { rank: 5, name: '时尚服饰', heat: 82, growth: '+15%', competition: '高', profitMargin: '35-55%' },
      { rank: 6, name: '母婴用品', heat: 80, growth: '+12%', competition: '中', profitMargin: '40-55%' },
      { rank: 7, name: '食品保健', heat: 78, growth: '+10%', competition: '中', profitMargin: '35-50%' },
      { rank: 8, name: '宠物用品', heat: 75, growth: '+28%', competition: '低', profitMargin: '45-60%' },
    ];
  },

  /**
   * 竞品分析
   * @param {string} category - 品类
   */
  getCompetitorAnalysis(category) {
    const competitors = {
      '美妆护肤': [
        { name: '完美日记海外版', marketShare: '15%', priceRange: '¥30-80', strengths: '品牌知名度高', weaknesses: '价格偏高' },
        { name: '花西子东南亚', marketShare: '12%', priceRange: '¥50-120', strengths: '国风设计', weaknesses: '品类单一' },
        { name: '本地品牌集合', marketShare: '40%', priceRange: '¥10-50', strengths: '价格优势', weaknesses: '品质参差' },
      ],
      '3C数码': [
        { name: '小米生态链', marketShare: '20%', priceRange: '¥50-300', strengths: '性价比高', weaknesses: '设计同质化' },
        { name: '深圳白牌', marketShare: '45%', priceRange: '¥10-100', strengths: '价格极低', weaknesses: '品质不稳' },
        { name: '本地品牌', marketShare: '25%', priceRange: '¥30-150', strengths: '渠道优势', weaknesses: '创新不足' },
      ],
    };

    if (category && competitors[category]) {
      return { category, competitors: competitors[category] };
    }
    return { message: '请选择品类查看竞品分析', availableCategories: Object.keys(competitors) };
  },
};

module.exports = dataAnalysis;
