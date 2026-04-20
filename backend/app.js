/**
 * Auto选品项目 - 后端主应用
 * 集成反扒机制
 */

const express = require('express');
const path = require('path');

// 引入反扒模块
const {
  ipLimiter,
  userLimiter,
  apiLimiter,
  checkUserAgent,
  behaviorAnalysis,
  shouldTriggerCaptcha,
  getClientIP
} = require('./middleware/antiScraping');

const captchaRoutes = require('./routes/captcha');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// ============ 反扒中间件 ============

// 1. UA检测（全局）
app.use(checkUserAgent);

// 2. 行为分析（全局）
app.use(behaviorAnalysis);

// 3. IP级别限流（全局API）
app.use('/api', ipLimiter());

// ============ 路由 ============

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 验证码路由
app.use('/api/captcha', captchaRoutes);

// 管理接口
app.use('/api/admin', adminRoutes);

// 示例API（带用户限流）
app.get('/api/products', userLimiter(), (req, res) => {
  res.json({
    success: true,
    products: [
      { id: 1, name: '示例产品1', price: 99.99 },
      { id: 2, name: '示例产品2', price: 149.99 }
    ]
  });
});

// 敏感API（带独立限流）
app.get('/api/product/analyze', apiLimiter(), (req, res) => {
  res.json({
    success: true,
    analysis: {
      score: 85,
      trend: 'up',
      competition: 'medium'
    }
  });
});

app.get('/api/product/select', apiLimiter(), (req, res) => {
  res.json({
    success: true,
    recommendations: [
      { productId: 'P001', score: 92, reason: '高需求低竞争' },
      { productId: 'P002', score: 88, reason: '利润率高' }
    ]
  });
});

// 验证码触发检测
app.post('/api/sensitive-action', (req, res) => {
  const ip = getClientIP(req);
  
  if (shouldTriggerCaptcha(req)) {
    return res.status(403).json({
      success: false,
      code: 'CAPTCHA_REQUIRED',
      message: '需要进行安全验证',
      requireCaptcha: true,
      captchaUrl: '/api/captcha/image'
    });
  }
  
  // 处理敏感操作
  res.json({
    success: true,
    message: '操作成功'
  });
});

// 反馈接口（带CSRF防护示例）
app.post('/api/feedback', (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({
      success: false,
      message: '内容不能为空'
    });
  }
  
  // XSS防护：转义HTML
  const safeContent = content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  res.json({
    success: true,
    message: '反馈已提交',
    feedback: safeContent
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AutoSelect] 反扒系统已启动`);
  console.log(`[AutoSelect] 监听端口: ${PORT}`);
  console.log(`[AutoSelect] 环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
