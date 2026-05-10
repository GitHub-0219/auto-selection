/**
 * Auto选品 - AI跨境新手加速器
 * 前端交互逻辑
 * TikTok Shop 东南亚市场智能选品平台
 */

// ========== 全局状态 ==========
const state = {
  currentSection: 'dashboard',
  products: [],
  dashboardData: null,
  categoryRanking: [],
  marketTrends: {},
};

// ========== API 基础配置 ==========
const API_BASE = '/api';

async function api(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || '请求失败');
    return data.data;
  } catch (err) {
    console.error(`[API错误] ${endpoint}:`, err);
    throw err;
  }
}

// ========== 导航切换 ==========
function initNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });
}

function switchSection(section) {
  // 更新导航高亮
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-section="${section}"]`).classList.add('active');

  // 切换内容区域
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(section).classList.add('active');

  state.currentSection = section;

  // 加载对应数据
  if (section === 'dashboard') loadDashboard();
  if (section === 'products') loadProducts();
  if (section === 'analysis') loadAnalysis();
}

// ========== 数据看板 ==========
async function loadDashboard() {
  try {
    const data = await api('/analysis/dashboard');
    state.dashboardData = data;
    renderDashboard(data);
  } catch (err) {
    // 使用本地模拟数据
    renderDashboard(getMockDashboard());
  }
}

function renderDashboard(data) {
  // 更新统计卡片
  const ov = data.overview;
  document.getElementById('statTotalProducts').textContent = ov.totalProducts;
  document.getElementById('statRecommended').textContent = ov.recommendedProducts;
  document.getElementById('statAvgScore').textContent = ov.avgScore;
  document.getElementById('statMarkets').textContent = ov.activeMarkets;

  // 渲染市场表格
  const tbody = document.getElementById('marketTableBody');
  tbody.innerHTML = data.marketOverview.map(m => `
    <tr>
      <td><strong>${getFlag(m.code)} ${m.market}</strong></td>
      <td>${m.products}</td>
      <td><span class="score-badge" style="color:${getScoreColor(m.avgScore)}">${m.avgScore}</span></td>
      <td class="trend-up">${m.trend}</td>
      <td><span class="status-badge active">活跃</span></td>
    </tr>
  `).join('');

  // 渲染品类网格
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = data.hotCategories.map(c => `
    <div class="category-item">
      <div class="cat-name">${c.name}</div>
      <div class="cat-growth">${c.growth}</div>
      <div class="cat-count">${c.products} 个商品</div>
    </div>
  `).join('');
}

function getMockDashboard() {
  return {
    overview: { totalProducts: 156, recommendedProducts: 42, avgScore: 76, activeMarkets: 5 },
    marketOverview: [
      { market: '泰国', code: 'TH', products: 38, avgScore: 78, trend: '+12%' },
      { market: '越南', code: 'VN', products: 35, avgScore: 75, trend: '+18%' },
      { market: '马来西亚', code: 'MY', products: 28, avgScore: 80, trend: '+8%' },
      { market: '菲律宾', code: 'PH', products: 30, avgScore: 73, trend: '+22%' },
      { market: '印尼', code: 'ID', products: 25, avgScore: 74, trend: '+15%' },
    ],
    hotCategories: [
      { name: '美妆护肤', growth: '+25%', products: 32, avgScore: 79 },
      { name: '3C数码', growth: '+20%', products: 28, avgScore: 76 },
      { name: '时尚服饰', growth: '+15%', products: 35, avgScore: 74 },
      { name: '家居生活', growth: '+18%', products: 22, avgScore: 77 },
      { name: '运动户外', growth: '+30%', products: 18, avgScore: 82 },
      { name: '母婴用品', growth: '+12%', products: 21, avgScore: 75 },
    ],
  };
}

// ========== 商品管理 ==========
async function loadProducts() {
  try {
    const products = await api('/products');
    state.products = products;
    renderProducts(products);
  } catch (err) {
    // 使用本地模拟数据
    state.products = getMockProducts();
    renderProducts(state.products);
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!products.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af;">暂无商品数据</div>';
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-header">
        <div class="product-name">${p.name}</div>
        <div class="product-score" style="background:${getScoreColor(p.score)}">${p.score}</div>
      </div>
      <div class="product-meta">
        <span class="meta-tag market">${getFlag(p.targetMarket)} ${getMarketName(p.targetMarket)}</span>
        <span class="meta-tag category">${p.category}</span>
        <span class="meta-tag ${p.status === 'recommended' ? 'status-rec' : 'status-watch'}">
          ${p.status === 'recommended' ? '⭐ 已推荐' : '👁 观察中'}
        </span>
      </div>
      <div class="product-metrics">
        <div class="metric">
          <div class="metric-value">¥${p.price}</div>
          <div class="metric-label">售价</div>
        </div>
        <div class="metric">
          <div class="metric-value">${p.sales ? (p.sales / 1000).toFixed(1) + 'k' : '-'}</div>
          <div class="metric-label">销量</div>
        </div>
        <div class="metric">
          <div class="metric-value">${p.rating || '-'}</div>
          <div class="metric-label">评分</div>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-sm" onclick="viewProductDetail('${p.id}')">📊 详情</button>
        <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')">✏️ 编辑</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">🗑 删除</button>
      </div>
    </div>
  `).join('');
}

function getMockProducts() {
  return [
    { id: 'demo-001', name: '便携式筋膜枪 Mini', category: '运动户外', price: 89.9, cost: 35, targetMarket: 'TH', score: 87, trend: 92, competition: 78, profit: 85, demand: 90, supply: 70, sales: 15200, rating: 4.8, tags: ['热销', '高利润'], status: 'recommended' },
    { id: 'demo-002', name: '车载手机支架 磁吸式', category: '3C数码', price: 29.9, cost: 8, targetMarket: 'VN', score: 82, trend: 85, competition: 70, profit: 90, demand: 78, supply: 80, sales: 32100, rating: 4.6, tags: ['爆款'], status: 'recommended' },
    { id: 'demo-003', name: '韩版防晒衣 UPF50+', category: '时尚服饰', price: 59.9, cost: 22, targetMarket: 'MY', score: 85, trend: 88, competition: 75, profit: 82, demand: 86, supply: 65, sales: 28700, rating: 4.7, tags: ['季节热销'], status: 'recommended' },
    { id: 'demo-004', name: '婴儿安抚玩偶 可水洗', category: '母婴用品', price: 39.9, cost: 12, targetMarket: 'PH', score: 79, trend: 75, competition: 68, profit: 88, demand: 80, supply: 75, sales: 18900, rating: 4.9, tags: ['高评分'], status: 'watching' },
    { id: 'demo-005', name: 'LED化妆镜 三色调光', category: '美妆护肤', price: 69.9, cost: 25, targetMarket: 'ID', score: 83, trend: 80, competition: 72, profit: 84, demand: 82, supply: 70, sales: 21500, rating: 4.5, tags: ['美妆必备'], status: 'watching' },
  ];
}

// 商品筛选
function initProductFilters() {
  ['filterCategory', 'filterMarket', 'filterStatus'].forEach(id => {
    document.getElementById(id).addEventListener('change', filterProducts);
  });
}

function filterProducts() {
  const category = document.getElementById('filterCategory').value;
  const market = document.getElementById('filterMarket').value;
  const status = document.getElementById('filterStatus').value;

  let filtered = [...state.products];
  if (category) filtered = filtered.filter(p => p.category === category);
  if (market) filtered = filtered.filter(p => p.targetMarket === market);
  if (status) filtered = filtered.filter(p => p.status === status);

  renderProducts(filtered);
}

// 添加商品弹窗
function initProductModal() {
  const modal = document.getElementById('addProductModal');
  const btnAdd = document.getElementById('btnAddProduct');
  const btnClose = document.getElementById('closeModal');
  const btnCancel = document.getElementById('cancelModal');
  const form = document.getElementById('addProductForm');

  btnAdd.addEventListener('click', () => modal.classList.add('show'));
  btnClose.addEventListener('click', () => modal.classList.remove('show'));
  btnCancel.addEventListener('click', () => modal.classList.remove('show'));
  modal.querySelector('.modal-overlay').addEventListener('click', () => modal.classList.remove('show'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
      name: document.getElementById('pName').value,
      category: document.getElementById('pCategory').value,
      targetMarket: document.getElementById('pMarket').value,
      price: Number(document.getElementById('pPrice').value) || 0,
      cost: Number(document.getElementById('pCost').value) || 0,
      score: Math.floor(Math.random() * 30) + 60,
      sales: 0,
      rating: 0,
      status: 'watching',
    };

    try {
      await api('/products', { method: 'POST', body: JSON.stringify(newProduct) });
      showToast('商品添加成功！', 'success');
    } catch {
      // 本地添加
      newProduct.id = 'local-' + Date.now();
      state.products.push(newProduct);
      renderProducts(state.products);
      showToast('商品已添加（本地）', 'success');
    }

    modal.classList.remove('show');
    form.reset();
  });
}

// 商品操作
function viewProductDetail(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const profitMargin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
  alert(`📊 商品详情\n\n` +
    `名称: ${p.name}\n` +
    `品类: ${p.category}\n` +
    `市场: ${getFlag(p.targetMarket)} ${getMarketName(p.targetMarket)}\n` +
    `评分: ${p.score} (${getScoreLevel(p.score)}级)\n` +
    `售价: ¥${p.price}\n` +
    `成本: ¥${p.cost}\n` +
    `利润率: ${profitMargin}%\n` +
    `销量: ${p.sales}\n` +
    `趋势: ${p.trend} | 竞争: ${p.competition} | 利润: ${p.profit}\n` +
    `需求: ${p.demand} | 供应: ${p.supply}`
  );
}

function editProduct(id) {
  showToast('编辑功能开发中...', 'info');
}

async function deleteProduct(id) {
  if (!confirm('确定删除此商品？')) return;
  try {
    await api(`/products/${id}`, { method: 'DELETE' });
    showToast('商品已删除', 'success');
    loadProducts();
  } catch {
    state.products = state.products.filter(p => p.id !== id);
    renderProducts(state.products);
    showToast('商品已删除（本地）', 'success');
  }
}

// ========== AI推荐 ==========
function initRecommendForm() {
  document.getElementById('recommendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = document.getElementById('recCategory').value;
    const market = document.getElementById('recMarket').value;
    const budget = document.getElementById('recBudget').value;

    try {
      const result = await api('/analysis/recommend', {
        method: 'POST',
        body: JSON.stringify({ category, market, budget: Number(budget) }),
      });
      renderRecommendations(result);
    } catch {
      renderRecommendations(getMockRecommendations(category, market));
    }
  });
}

function renderRecommendations(result) {
  const container = document.getElementById('recommendResults');
  const list = document.getElementById('recommendList');
  const time = document.getElementById('recommendTime');

  container.style.display = 'block';
  time.textContent = `生成于 ${new Date().toLocaleString('zh-CN')}`;

  list.innerHTML = result.items.map(item => `
    <div class="recommend-item">
      <div class="rec-header">
        <div class="rec-rank ${item.rank <= 3 ? 'top' : ''}">${item.rank}</div>
        <div class="rec-name">${item.name}</div>
        <div class="rec-score">${item.score}分</div>
      </div>
      <div class="rec-reason">${item.reason}</div>
      <div class="rec-footer">
        <span class="rec-tag profit">💰 预估利润: ${item.estimatedProfit}</span>
        <span class="rec-tag risk-${item.risk === '低' ? 'low' : 'mid'}">🛡 风险: ${item.risk}</span>
        <span class="rec-tag profit">${getFlag(item.market)} ${getMarketName(item.market)}</span>
      </div>
    </div>
  `).join('');
}

function getMockRecommendations(category, market) {
  const items = [
    { rank: 1, name: '便携式筋膜枪 Mini', category: '运动户外', market: 'TH', reason: '泰国健身文化盛行，筋膜枪搜索量月增120%，竞争度低，利润率高达61%', score: 92, estimatedProfit: '¥3000-5000/月', risk: '低' },
    { rank: 2, name: '车载手机支架 磁吸式', category: '3C数码', market: 'VN', reason: '越南摩托车保有量大，车载配件需求旺盛，轻小件物流成本低', score: 88, estimatedProfit: '¥2000-4000/月', risk: '低' },
    { rank: 3, name: '韩版防晒衣 UPF50+', category: '时尚服饰', market: 'MY', reason: '东南亚常年高温，防晒需求持续增长，马来西亚消费力强', score: 85, estimatedProfit: '¥2500-4500/月', risk: '中' },
    { rank: 4, name: 'LED化妆镜 三色调光', category: '美妆护肤', market: 'ID', reason: '印尼美妆市场快速增长，化妆镜作为配件类目竞争小', score: 83, estimatedProfit: '¥2000-3500/月', risk: '低' },
    { rank: 5, name: '婴儿安抚玩偶 可水洗', category: '母婴用品', market: 'PH', reason: '菲律宾人口年轻化，母婴品类需求大，复购率高', score: 79, estimatedProfit: '¥1500-3000/月', risk: '低' },
  ];

  let filtered = items;
  if (category) filtered = filtered.filter(i => i.category === category);
  if (market) filtered = filtered.filter(i => i.market === market);

  return { query: { category, market }, total: filtered.length, items: filtered };
}

// ========== 市场分析 ==========
async function loadAnalysis() {
  try {
    const [ranking, trends] = await Promise.all([
      api('/analysis/categories'),
      api('/analysis/trends'),
    ]);
    state.categoryRanking = ranking;
    state.marketTrends = trends;
    renderAnalysis(ranking, trends);
  } catch {
    renderAnalysis(getMockCategoryRanking(), getMockMarketTrends());
  }
}

function renderAnalysis(ranking, trends) {
  // 品类排行
  const list = document.getElementById('categoryRanking');
  list.innerHTML = ranking.map(c => `
    <div class="ranking-item">
      <div class="rank-num">${c.rank}</div>
      <div class="rank-info">
        <div class="rank-name">${c.name}</div>
        <div class="rank-meta">利润率 ${c.profitMargin} | 竞争度 ${c.competition}</div>
      </div>
      <div class="rank-bar">
        <div class="rank-bar-fill" style="width:${c.heat}%"></div>
      </div>
      <div class="rank-stats">
        <span>热度 <strong>${c.heat}</strong></span>
        <span>增长 <strong>${c.growth}</strong></span>
      </div>
    </div>
  `).join('');

  // 市场详情
  const details = document.getElementById('marketDetails');
  details.innerHTML = Object.entries(trends).map(([code, t]) => `
    <div class="market-card">
      <div class="market-header">
        <h4>${getFlag(code)} ${t.name}</h4>
        <p>增长率 ${t.growth} | 热门品类: ${t.topCategories.join('、')}</p>
      </div>
      <div class="market-body">
        <strong style="font-size:13px;">🔑 热门关键词</strong>
        <div class="market-keywords">
          ${t.hotKeywords.map(k => `<span class="keyword-tag">${k}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function getMockCategoryRanking() {
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
}

function getMockMarketTrends() {
  return {
    TH: { name: '泰国', topCategories: ['美妆护肤', '时尚服饰', '食品保健'], growth: '+12%', hotKeywords: ['防晒', '美白', '减肥'] },
    VN: { name: '越南', topCategories: ['3C数码', '家居生活', '时尚服饰'], growth: '+18%', hotKeywords: ['手机壳', '耳机', '收纳'] },
    MY: { name: '马来西亚', topCategories: ['美妆护肤', '母婴用品', '运动户外'], growth: '+8%', hotKeywords: ['护肤', '婴儿', '瑜伽'] },
    PH: { name: '菲律宾', topCategories: ['3C数码', '时尚服饰', '家居生活'], growth: '+22%', hotKeywords: ['手机配件', 'T恤', '厨具'] },
    ID: { name: '印尼', topCategories: ['美妆护肤', '时尚服饰', '食品保健'], growth: '+15%', hotKeywords: ['面膜', '头巾', '零食'] },
  };
}

// ========== 工具函数 ==========
function getFlag(code) {
  const flags = { TH: '🇹🇭', VN: '🇻🇳', MY: '🇲🇾', PH: '🇵🇭', ID: '🇮🇩' };
  return flags[code] || '🌏';
}

function getMarketName(code) {
  const names = { TH: '泰国', VN: '越南', MY: '马来西亚', PH: '菲律宾', ID: '印尼' };
  return names[code] || '未知';
}

function getScoreColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  if (score >= 45) return '#f97316';
  return '#ef4444';
}

function getScoreLevel(score) {
  if (score >= 85) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  return 'D';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== 市场选择器 ==========
function initMarketSelector() {
  document.getElementById('marketSelect').addEventListener('change', (e) => {
    const market = e.target.value;
    if (state.currentSection === 'products') {
      document.getElementById('filterMarket').value = market === 'all' ? '' : market;
      filterProducts();
    }
  });
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProductFilters();
  initProductModal();
  initRecommendForm();
  initMarketSelector();
  loadDashboard();
});
