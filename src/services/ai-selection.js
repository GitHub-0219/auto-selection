/**
 * AI选品核心服务
 * 基于多维度评分模型，为 TikTok Shop 东南亚市场提供智能选品推荐
 */

const config = require('../config');

/**
 * 五维评分模型
 * 趋势热度(25%) + 竞争度(20%) + 利润空间(25%) + 需求量(20%) + 供应链(10%) = 100分
 */
const WEIGHTS = config.scoring.weights;

const aiSelection = {
  /**
   * 商品评分
   * @param {Object} productData - 商品数据
   * @returns {Object} 评分结果
   */
  scoreProduct(productData) {
    const { trend = 50, competition = 50, profit = 50, demand = 50, supply = 50 } = productData;

    // 计算加权总分
    const totalScore = Math.round(
      trend * WEIGHTS.trend +
      (100 - competition) * WEIGHTS.competition + // 竞争度越低越好
      profit * WEIGHTS.profit +
      demand * WEIGHTS.demand +
      (100 - supply) * WEIGHTS.supply // 供应链难度越低越好
    );

    // 评级
    let level, advice;
    if (totalScore >= 85) {
      level = 'S';
      advice = '强烈推荐！市场热度高、竞争小、利润可观，建议立即切入。';
    } else if (totalScore >= 75) {
      level = 'A';
      advice = '优质商品，建议关注并适时入场。';
    } else if (totalScore >= 60) {
      level = 'B';
      advice = '有一定机会，建议进一步调研后再决定。';
    } else if (totalScore >= 45) {
      level = 'C';
      advice = '风险较高，建议谨慎考虑。';
    } else {
      level = 'D';
      advice = '不推荐，各项指标均不理想。';
    }

    return {
      totalScore,
      level,
      advice,
      dimensions: {
        trend: { score: trend, weight: WEIGHTS.trend, label: '趋势热度' },
        competition: { score: competition, weight: WEIGHTS.competition, label: '竞争度', note: '越低越好' },
        profit: { score: profit, weight: WEIGHTS.profit, label: '利润空间' },
        demand: { score: demand, weight: WEIGHTS.demand, label: '需求量' },
        supply: { score: supply, weight: WEIGHTS.supply, label: '供应链难度', note: '越低越好' },
      },
      calculatedAt: new Date().toISOString(),
    };
  },

  /**
   * AI智能推荐
   * @param {Object} params - 推荐参数
   * @returns {Array} 推荐商品列表
   */
  getRecommendations(params = {}) {
    const { category, market, budget } = params;

    // 模拟推荐结果（实际项目中会调用 AI API）
    const recommendations = [
      {
        rank: 1,
        name: '便携式筋膜枪 Mini',
        category: '运动户外',
        market: 'TH',
        reason: '泰国健身文化盛行，筋膜枪搜索量月增120%，竞争度低，利润率高达61%',
        score: 92,
        estimatedProfit: '¥3000-5000/月',
        risk: '低',
      },
      {
        rank: 2,
        name: '车载手机支架 磁吸式',
        category: '3C数码',
        market: 'VN',
        reason: '越南摩托车保有量大，车载配件需求旺盛，轻小件物流成本低',
        score: 88,
        estimatedProfit: '¥2000-4000/月',
        risk: '低',
      },
      {
        rank: 3,
        name: '韩版防晒衣 UPF50+',
        category: '时尚服饰',
        market: 'MY',
        reason: '东南亚常年高温，防晒需求持续增长，马来西亚消费力强',
        score: 85,
        estimatedProfit: '¥2500-4500/月',
        risk: '中',
      },
      {
        rank: 4,
        name: 'LED化妆镜 三色调光',
        category: '美妆护肤',
        market: 'ID',
        reason: '印尼美妆市场快速增长，化妆镜作为配件类目竞争小',
        score: 83,
        estimatedProfit: '¥2000-3500/月',
        risk: '低',
      },
      {
        rank: 5,
        name: '婴儿安抚玩偶 可水洗',
        category: '母婴用品',
        market: 'PH',
        reason: '菲律宾人口年轻化，母婴品类需求大，复购率高',
        score: 79,
        estimatedProfit: '¥1500-3000/月',
        risk: '低',
      },
    ];

    // 按条件筛选
    let filtered = recommendations;
    if (category) filtered = filtered.filter(r => r.category === category);
    if (market) filtered = filtered.filter(r => r.market === market);

    return {
      query: params,
      total: filtered.length,
      items: filtered,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * 生成选品报告摘要
   * @param {Object} product - 商品信息
   * @returns {Object} 报告摘要
   */
  generateReport(product) {
    const scoreResult = this.scoreProduct(product);
    return {
      productName: product.name,
      summary: `${product.name} 在${product.market || '东南亚'}市场的综合评分为 ${scoreResult.totalScore}（${scoreResult.level}级）。${scoreResult.advice}`,
      score: scoreResult,
      nextSteps: [
        '确认供应链稳定性',
        '调研目标市场竞品定价',
        '准备商品素材和Listing',
        '小批量测试投放',
      ],
    };
  },
};

module.exports = aiSelection;
