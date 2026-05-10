/**
 * 工具函数集合
 * 通用辅助方法
 */

const helpers = {
  /**
   * 格式化货币
   * @param {number} amount - 金额
   * @param {string} currency - 货币代码
   */
  formatCurrency(amount, currency = 'CNY') {
    const symbols = { CNY: '¥', USD: '$', THB: '฿', VND: '₫', MYR: 'RM', PHP: '₱', IDR: 'Rp' };
    return `${symbols[currency] || ''}${Number(amount).toFixed(2)}`;
  },

  /**
   * 计算利润率
   * @param {number} price - 售价
   * @param {number} cost - 成本
   */
  calcProfitMargin(price, cost) {
    if (!price || price <= 0) return 0;
    return Math.round(((price - cost) / price) * 100);
  },

  /**
   * 生成分页信息
   * @param {number} total - 总数
   * @param {number} page - 当前页
   * @param {number} pageSize - 每页数量
   */
  paginate(total, page = 1, pageSize = 20) {
    const totalPages = Math.ceil(total / pageSize);
    return {
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },

  /**
   * 获取评分等级颜色
   * @param {number} score - 分数
   */
  getScoreColor(score) {
    if (score >= 85) return '#22c55e'; // 绿色 - S级
    if (score >= 75) return '#3b82f6'; // 蓝色 - A级
    if (score >= 60) return '#f59e0b'; // 黄色 - B级
    if (score >= 45) return '#f97316'; // 橙色 - C级
    return '#ef4444'; // 红色 - D级
  },

  /**
   * 获取评分等级文字
   * @param {number} score - 分数
   */
  getScoreLevel(score) {
    if (score >= 85) return 'S';
    if (score >= 75) return 'A';
    if (score >= 60) return 'B';
    if (score >= 45) return 'C';
    return 'D';
  },

  /**
   * 市场代码转国旗emoji
   * @param {string} code - 市场代码
   */
  marketToFlag(code) {
    const flags = { TH: '🇹🇭', VN: '🇻🇳', MY: '🇲🇾', PH: '🇵🇭', ID: '🇮🇩' };
    return flags[code] || '🌏';
  },

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 安全的JSON解析
   * @param {string} str - JSON字符串
   * @param {*} defaultValue - 默认值
   */
  safeParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  },

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },
};

module.exports = helpers;
