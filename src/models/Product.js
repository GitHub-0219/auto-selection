/**
 * 商品数据模型
 * 用于存储和管理 TikTok Shop 商品信息
 */

// 内存数据存储（MVP阶段，后续替换为 MongoDB）
let products = [
  {
    id: 'demo-001',
    name: '便携式筋膜枪 Mini',
    nameEn: 'Mini Portable Massage Gun',
    category: '运动户外',
    price: 89.9,
    cost: 35,
    currency: 'CNY',
    targetMarket: 'TH',
    score: 87,
    trend: 92,
    competition: 78,
    profit: 85,
    demand: 90,
    supply: 70,
    sales: 15200,
    rating: 4.8,
    tags: ['热销', '高利润', '轻小件'],
    image: 'https://via.placeholder.com/200x200?text=Massage+Gun',
    status: 'recommended',
    createdAt: '2026-05-01T08:00:00Z',
  },
  {
    id: 'demo-002',
    name: '车载手机支架 磁吸式',
    nameEn: 'Magnetic Car Phone Mount',
    category: '3C数码',
    price: 29.9,
    cost: 8,
    currency: 'CNY',
    targetMarket: 'VN',
    score: 82,
    trend: 85,
    competition: 70,
    profit: 90,
    demand: 78,
    supply: 80,
    sales: 32100,
    rating: 4.6,
    tags: ['爆款', '高复购', '轻小件'],
    image: 'https://via.placeholder.com/200x200?text=Phone+Mount',
    status: 'recommended',
    createdAt: '2026-05-02T10:30:00Z',
  },
  {
    id: 'demo-003',
    name: '韩版防晒衣 UPF50+',
    nameEn: 'Korean Style UV Protection Jacket',
    category: '时尚服饰',
    price: 59.9,
    cost: 22,
    currency: 'CNY',
    targetMarket: 'MY',
    score: 85,
    trend: 88,
    competition: 75,
    profit: 82,
    demand: 86,
    supply: 65,
    sales: 28700,
    rating: 4.7,
    tags: ['季节热销', '高需求', '轻小件'],
    image: 'https://via.placeholder.com/200x200?text=UV+Jacket',
    status: 'recommended',
    createdAt: '2026-05-03T09:15:00Z',
  },
  {
    id: 'demo-004',
    name: '婴儿安抚玩偶 可水洗',
    nameEn: 'Baby Soothing Plush Toy',
    category: '母婴用品',
    price: 39.9,
    cost: 12,
    currency: 'CNY',
    targetMarket: 'PH',
    score: 79,
    trend: 75,
    competition: 68,
    profit: 88,
    demand: 80,
    supply: 75,
    sales: 18900,
    rating: 4.9,
    tags: ['高评分', '高利润', '复购率高'],
    image: 'https://via.placeholder.com/200x200?text=Baby+Toy',
    status: 'watching',
    createdAt: '2026-05-04T14:00:00Z',
  },
  {
    id: 'demo-005',
    name: 'LED化妆镜 三色调光',
    nameEn: 'LED Makeup Mirror 3-Color',
    category: '美妆护肤',
    price: 69.9,
    cost: 25,
    currency: 'CNY',
    targetMarket: 'ID',
    score: 83,
    trend: 80,
    competition: 72,
    profit: 84,
    demand: 82,
    supply: 70,
    sales: 21500,
    rating: 4.5,
    tags: ['美妆必备', '利润可观', '稳定出单'],
    image: 'https://via.placeholder.com/200x200?text=LED+Mirror',
    status: 'watching',
    createdAt: '2026-05-05T11:45:00Z',
  },
];

let nextId = 6;

/**
 * 商品数据模型类
 */
class Product {
  /** 获取所有商品 */
  static findAll(filters = {}) {
    let result = [...products];
    if (filters.category) {
      result = result.filter(p => p.category === filters.category);
    }
    if (filters.targetMarket) {
      result = result.filter(p => p.targetMarket === filters.targetMarket);
    }
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.minScore) {
      result = result.filter(p => p.score >= Number(filters.minScore));
    }
    // 排序
    const sortBy = filters.sortBy || 'score';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    result.sort((a, b) => (a[sortBy] - b[sortBy]) * sortOrder);
    return result;
  }

  /** 根据ID查找商品 */
  static findById(id) {
    return products.find(p => p.id === id) || null;
  }

  /** 创建商品 */
  static create(data) {
    const product = {
      id: `prod-${String(nextId++).padStart(3, '0')}`,
      name: data.name || '未命名商品',
      nameEn: data.nameEn || '',
      category: data.category || '其他',
      price: Number(data.price) || 0,
      cost: Number(data.cost) || 0,
      currency: data.currency || 'CNY',
      targetMarket: data.targetMarket || 'TH',
      score: Number(data.score) || 0,
      trend: Number(data.trend) || 0,
      competition: Number(data.competition) || 0,
      profit: Number(data.profit) || 0,
      demand: Number(data.demand) || 0,
      supply: Number(data.supply) || 0,
      sales: Number(data.sales) || 0,
      rating: Number(data.rating) || 0,
      tags: data.tags || [],
      image: data.image || '',
      status: data.status || 'watching',
      createdAt: new Date().toISOString(),
    };
    products.push(product);
    return product;
  }

  /** 更新商品 */
  static update(id, data) {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...data, id };
    return products[index];
  }

  /** 删除商品 */
  static delete(id) {
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  }

  /** 获取统计信息 */
  static getStats() {
    return {
      total: products.length,
      recommended: products.filter(p => p.status === 'recommended').length,
      watching: products.filter(p => p.status === 'watching').length,
      avgScore: products.length
        ? Math.round(products.reduce((s, p) => s + p.score, 0) / products.length)
        : 0,
      categories: [...new Set(products.map(p => p.category))],
      markets: [...new Set(products.map(p => p.targetMarket))],
    };
  }
}

module.exports = Product;
