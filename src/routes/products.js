/**
 * 商品路由 - CRUD 接口
 * 管理 TikTok Shop 东南亚市场商品
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET /api/products
 * 获取商品列表（支持筛选和排序）
 */
router.get('/', (req, res) => {
  try {
    const { category, targetMarket, status, minScore, sortBy, sortOrder } = req.query;
    const products = Product.findAll({ category, targetMarket, status, minScore, sortBy, sortOrder });
    res.json({ success: true, data: products, total: products.length });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商品列表失败', error: err.message });
  }
});

/**
 * GET /api/products/stats
 * 获取商品统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const stats = Product.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取统计信息失败', error: err.message });
  }
});

/**
 * GET /api/products/:id
 * 获取单个商品详情
 */
router.get('/:id', (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取商品详情失败', error: err.message });
  }
});

/**
 * POST /api/products
 * 创建新商品
 */
router.post('/', (req, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: '商品名称不能为空' });
    const product = Product.create(req.body);
    res.status(201).json({ success: true, data: product, message: '商品创建成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建商品失败', error: err.message });
  }
});

/**
 * PUT /api/products/:id
 * 更新商品信息
 */
router.put('/:id', (req, res) => {
  try {
    const product = Product.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ success: false, message: '商品不存在' });
    res.json({ success: true, data: product, message: '商品更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新商品失败', error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 * 删除商品
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = Product.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: '商品不存在' });
    res.json({ success: true, message: '商品删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除商品失败', error: err.message });
  }
});

module.exports = router;
