/**
 * Auto选品 - AI跨境新手加速器
 * Express 服务器入口文件
 * 聚焦 TikTok Shop 东南亚市场
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 前端页面
app.use(express.static(path.join(__dirname, '../frontend')));

// CORS 支持（开发环境）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Auto选品 - AI跨境新手加速器',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API 路由
app.use('/api/products', require('./routes/products'));
app.use('/api/analysis', require('./routes/analysis'));

// 兜底路由 - 返回前端首页
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('[服务器错误]', err.message);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

// 启动服务器
app.listen(PORT, () => {
});

module.exports = app;
