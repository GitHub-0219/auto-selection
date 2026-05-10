/**
 * 分析路由 - 数据分析接口
 * 提供市场趋势、选品评分、竞品分析等数据服务
 */

const express = require('express');
const router = express.Router();
const aiSelection = require('../services/ai-selection');
const dataAnalysis = require('../services/data-analysis');

/**
 * GET /api/analysis/dashboard
 * 获取数据看板概览
 */
router.get('/dashboard', (req, res) => {
  try {
    const dashboard = dataAnalysis.getDashboardData();
    res.json({ success: true, data: dashboard });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取看板数据失败', error: err.message });
  }
});

/**
 * GET /api/analysis/trends
 * 获取市场趋势数据
 */
router.get('/trends', (req, res) => {
  try {
    const { market, period } = req.query;
    const trends = dataAnalysis.getMarketTrends(market, period);
    res.json({ success: true, data: trends });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取趋势数据失败', error: err.message });
  }
});

/**
 * POST /api/analysis/score
 * 商品评分分析
 */
router.post('/score', (req, res) => {
  try {
    const { productData } = req.body;
    if (!productData) return res.status(400).json({ success: false, message: '请提供商品数据' });
    const scoreResult = aiSelection.scoreProduct(productData);
    res.json({ success: true, data: scoreResult });
  } catch (err) {
    res.status(500).json({ success: false, message: '评分分析失败', error: err.message });
  }
});

/**
 * POST /api/analysis/recommend
 * AI智能选品推荐
 */
router.post('/recommend', (req, res) => {
  try {
    const { category, market, budget } = req.body;
    const recommendations = aiSelection.getRecommendations({ category, market, budget });
    res.json({ success: true, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: '推荐生成失败', error: err.message });
  }
});

/**
 * GET /api/analysis/competitors
 * 竞品分析
 */
router.get('/competitors', (req, res) => {
  try {
    const { category } = req.query;
    const competitors = dataAnalysis.getCompetitorAnalysis(category);
    res.json({ success: true, data: competitors });
  } catch (err) {
    res.status(500).json({ success: false, message: '竞品分析失败', error: err.message });
  }
});

/**
 * GET /api/analysis/categories
 * 品类热度排行
 */
router.get('/categories', (req, res) => {
  try {
    const categories = dataAnalysis.getCategoryRanking();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取品类排行失败', error: err.message });
  }
});

module.exports = router;
