/**
 * 管理API路由 - 黑名单管理、统计等
 */

const express = require('express');
const router = express.Router();
const blacklist = require('../middleware/blacklist');
const { getBlacklist, getIPStats } = require('../middleware/antiScraping');
const { getWhitelist } = require('../middleware/blacklist');

// 中间件：管理员认证（实际项目中需要完善）
function adminAuth(req, res, next) {
  const apiKey = req.headers['x-admin-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY || 'admin-secret-key';
  
  if (apiKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: '未授权访问'
    });
  }
  
  next();
}

// ============ 黑名单管理 ============

/**
 * 获取黑名单列表
 * GET /api/admin/blacklist
 */
router.get('/blacklist', adminAuth, (req, res) => {
  try {
    const { includeExpired } = req.query;
    const result = getBlacklist({ includeExpired: includeExpired === 'true' });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Admin] 获取黑名单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取黑名单失败'
    });
  }
});

/**
 * 获取白名单列表
 * GET /api/admin/whitelist
 */
router.get('/whitelist', adminAuth, (req, res) => {
  try {
    const result = getWhitelist();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Admin] 获取白名单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取白名单失败'
    });
  }
});

/**
 * 封禁IP
 * POST /api/admin/blacklist/block
 */
router.post('/blacklist/block', adminAuth, (req, res) => {
  const { ip, reason, duration } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      message: '缺少IP地址'
    });
  }
  
  try {
    const result = blacklist.blockIP(ip, {
      reason: reason || '手动封禁',
      duration: duration || 0,  // 0表示永久
      addedBy: req.headers['x-admin-user'] || 'admin'
    });
    
    res.json({
      success: true,
      message: 'IP已封禁',
      ...result
    });
  } catch (error) {
    console.error('[Admin] 封禁IP失败:', error);
    res.status(500).json({
      success: false,
      message: '封禁IP失败'
    });
  }
});

/**
 * 批量封禁IP
 * POST /api/admin/blacklist/block-batch
 */
router.post('/blacklist/block-batch', adminAuth, (req, res) => {
  const { ips, reason, duration } = req.body;
  
  if (!ips || !Array.isArray(ips)) {
    return res.status(400).json({
      success: false,
      message: '缺少IP列表'
    });
  }
  
  try {
    const result = blacklist.blockIPs(ips, {
      reason: reason || '批量封禁',
      duration: duration || 0,
      addedBy: req.headers['x-admin-user'] || 'admin'
    });
    
    res.json({
      success: true,
      message: `成功封禁 ${result.blocked} 个IP`,
      ...result
    });
  } catch (error) {
    console.error('[Admin] 批量封禁失败:', error);
    res.status(500).json({
      success: false,
      message: '批量封禁失败'
    });
  }
});

/**
 * 封禁IP段
 * POST /api/admin/blacklist/block-range
 */
router.post('/blacklist/block-range', adminAuth, (req, res) => {
  const { startIP, endIP, reason, duration } = req.body;
  
  if (!startIP || !endIP) {
    return res.status(400).json({
      success: false,
      message: '缺少IP范围'
    });
  }
  
  try {
    const result = blacklist.blockIPRange(startIP, endIP, {
      reason: reason || 'IP段封禁',
      duration: duration || 0,
      addedBy: req.headers['x-admin-user'] || 'admin'
    });
    
    res.json({
      success: true,
      message: `成功封禁 ${result.count} 个IP`,
      ...result
    });
  } catch (error) {
    console.error('[Admin] IP段封禁失败:', error);
    res.status(500).json({
      success: false,
      message: 'IP段封禁失败'
    });
  }
});

/**
 * 封禁CIDR网段
 * POST /api/admin/blacklist/block-cidr
 */
router.post('/blacklist/block-cidr', adminAuth, (req, res) => {
  const { cidr, reason, duration } = req.body;
  
  if (!cidr) {
    return res.status(400).json({
      success: false,
      message: '缺少CIDR'
    });
  }
  
  try {
    const result = blacklist.blockCIDR(cidr, {
      reason: reason || 'CIDR封禁',
      duration: duration || 0,
      addedBy: req.headers['x-admin-user'] || 'admin'
    });
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason
      });
    }
    
    res.json({
      success: true,
      message: `成功封禁 ${result.count} 个IP`,
      ...result
    });
  } catch (error) {
    console.error('[Admin] CIDR封禁失败:', error);
    res.status(500).json({
      success: false,
      message: 'CIDR封禁失败'
    });
  }
});

/**
 * 解禁IP
 * POST /api/admin/blacklist/unblock
 */
router.post('/blacklist/unblock', adminAuth, (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      message: '缺少IP地址'
    });
  }
  
  try {
    const result = blacklist.unblockIP(ip);
    
    res.json({
      success: true,
      message: result.existed ? 'IP已解禁' : 'IP不在黑名单中',
      ...result
    });
  } catch (error) {
    console.error('[Admin] 解禁IP失败:', error);
    res.status(500).json({
      success: false,
      message: '解禁IP失败'
    });
  }
});

/**
 * 添加到白名单
 * POST /api/admin/whitelist/add
 */
router.post('/whitelist/add', adminAuth, (req, res) => {
  const { ip, note } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      message: '缺少IP地址'
    });
  }
  
  try {
    const result = blacklist.addToWhitelist(ip, note || '');
    
    res.json({
      success: true,
      message: 'IP已添加到白名单',
      ...result
    });
  } catch (error) {
    console.error('[Admin] 添加白名单失败:', error);
    res.status(500).json({
      success: false,
      message: '添加白名单失败'
    });
  }
});

/**
 * 从白名单移除
 * POST /api/admin/whitelist/remove
 */
router.post('/whitelist/remove', adminAuth, (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({
      success: false,
      message: '缺少IP地址'
    });
  }
  
  try {
    const result = blacklist.removeFromWhitelist(ip);
    
    res.json({
      success: true,
      message: result.removed ? 'IP已从白名单移除' : 'IP不在白名单中',
      ...result
    });
  } catch (error) {
    console.error('[Admin] 移除白名单失败:', error);
    res.status(500).json({
      success: false,
      message: '移除白名单失败'
    });
  }
});

/**
 * 导出黑名单
 * GET /api/admin/blacklist/export
 */
router.get('/blacklist/export', adminAuth, (req, res) => {
  try {
    const data = blacklist.exportBlacklist();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=blacklist.json');
    res.send(data);
  } catch (error) {
    console.error('[Admin] 导出黑名单失败:', error);
    res.status(500).json({
      success: false,
      message: '导出黑名单失败'
    });
  }
});

/**
 * 导入黑名单
 * POST /api/admin/blacklist/import
 */
router.post('/blacklist/import', adminAuth, (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    return res.status(400).json({
      success: false,
      message: '缺少导入数据'
    });
  }
  
  try {
    const result = blacklist.importBlacklist(data);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason
      });
    }
    
    res.json({
      success: true,
      message: `成功导入 ${result.imported} 条记录`,
      ...result
    });
  } catch (error) {
    console.error('[Admin] 导入黑名单失败:', error);
    res.status(500).json({
      success: false,
      message: '导入黑名单失败'
    });
  }
});

// ============ 统计接口 ============

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
router.get('/stats', adminAuth, (req, res) => {
  try {
    const blacklistStats = getBlacklist();
    
    res.json({
      success: true,
      stats: {
        blacklistCount: blacklistStats.total,
        whitelistCount: blacklist.size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Admin] 获取统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败'
    });
  }
});

/**
 * 获取IP详情
 * GET /api/admin/ip/:ip
 */
router.get('/ip/:ip', adminAuth, (req, res) => {
  const { ip } = req.params;
  
  try {
    const isBlocked = blacklist.isBlocked(ip);
    const isWhitelisted = blacklist.isWhitelisted(ip);
    const stats = getIPStats(ip);
    
    res.json({
      success: true,
      ip,
      status: {
        blocked: isBlocked,
        whitelisted: isWhitelisted
      },
      stats
    });
  } catch (error) {
    console.error('[Admin] 获取IP详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取IP详情失败'
    });
  }
});

module.exports = router;
