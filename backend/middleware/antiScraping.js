/**
 * 反扒中间件 - Anti-Scraping Middleware
 * 功能：IP限流、API限流、UA检测、IP黑名单
 */

const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// 内存存储（生产环境建议使用Redis）
const ipStore = new Map();
const userStore = new Map();
const apiStore = new Map();
const blacklist = new Set();

// 配置
const CONFIG = {
  ipLimit: {
    windowMs: 60 * 1000,  // 1分钟窗口
    max: 100              // 最多100次请求
  },
  userLimit: {
    windowMs: 60 * 1000,
    max: 50
  },
  apiLimit: {
    windowMs: 60 * 1000,
    max: 20               // 敏感API每分钟20次
  },
  sensitiveApis: [
    '/api/product/analyze',
    '/api/product/select',
    '/api/market/trend',
    '/api/competition/analysis'
  ],
  blockedUAs: [
    'scrapy', 'python-requests', 'python-urllib', 'curl', 'wget',
    'httpx', 'aiohttp', 'node-fetch', 'axios/0.', 'postman',
    'insomnia', 'abot', 'semrush', 'ahrefs', 'majestic'
  ]
};

/**
 * 获取客户端IP
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

/**
 * 获取用户标识
 */
function getUserIdentifier(req) {
  // 优先使用用户ID，其次使用IP
  return req.user?.id || getClientIP(req);
}

/**
 * IP级别限流中间件
 */
function createIPLimiter() {
  return rateLimit({
    windowMs: CONFIG.ipLimit.windowMs,
    max: CONFIG.ipLimit.max,
    keyGenerator: () => getClientIP(req),
    handler: (req, res) => {
      const ip = getClientIP(req);
      console.warn(`[AntiScraping] IP限流触发: ${ip}`);
      res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_IP',
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(CONFIG.ipLimit.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * 用户级别限流中间件
 */
function createUserLimiter() {
  return rateLimit({
    windowMs: CONFIG.userLimit.windowMs,
    max: CONFIG.userLimit.max,
    keyGenerator: () => getUserIdentifier(req),
    handler: (req, res) => {
      const userId = getUserIdentifier(req);
      console.warn(`[AntiScraping] 用户限流触发: ${userId}`);
      res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_USER',
        message: '操作过于频繁，请稍后再试',
        retryAfter: Math.ceil(CONFIG.userLimit.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * API级别限流中间件（敏感API）
 */
function createApiLimiter() {
  return rateLimit({
    windowMs: CONFIG.apiLimit.windowMs,
    max: CONFIG.apiLimit.max,
    keyGenerator: (req) => `${getClientIP(req)}:${req.path}`,
    handler: (req, res) => {
      const ip = getClientIP(req);
      console.warn(`[AntiScraping] API限流触发: ${ip} -> ${req.path}`);
      res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_API',
        message: 'API调用超过限制，请稍后重试',
        retryAfter: Math.ceil(CONFIG.apiLimit.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * UA检测中间件
 */
function checkUserAgent(req, res, next) {
  const ua = req.get('User-Agent') || '';
  const ip = getClientIP(req);
  
  // 检测是否在黑名单中
  if (blacklist.has(ip)) {
    console.warn(`[AntiScraping] 黑名单IP访问: ${ip}`);
    return res.status(403).json({
      success: false,
      code: 'IP_BLOCKED',
      message: '访问被拒绝'
    });
  }
  
  // 检测爬虫UA
  const isBlocked = CONFIG.blockedUAs.some(blockedUA => 
    ua.toLowerCase().includes(blockedUA.toLowerCase())
  );
  
  if (isBlocked || !ua) {
    console.warn(`[AntiScraping] 爬虫UA检测: ${ip} - ${ua}`);
    return res.status(403).json({
      success: false,
      code: 'INVALID_UA',
      message: '访问被拒绝'
    });
  }
  
  next();
}

/**
 * 行为分析中间件
 */
function behaviorAnalysis(req, res, next) {
  const ip = getClientIP(req);
  const now = Date.now();
  
  // 初始化或获取访问记录
  if (!ipStore.has(ip)) {
    ipStore.set(ip, {
      firstAccess: now,
      lastAccess: now,
      requestCount: 1,
      accessPattern: []
    });
  } else {
    const record = ipStore.get(ip);
    const timeDiff = now - record.lastAccess;
    
    // 检测过于规律的访问模式（机器人特征）
    if (record.accessPattern.length >= 5) {
      const intervals = [];
      for (let i = 1; i < record.accessPattern.length; i++) {
        intervals.push(record.accessPattern[i] - record.accessPattern[i-1]);
      }
      
      // 检查间隔是否过于一致（方差小于10ms视为机器人）
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / intervals.length;
      
      if (variance < 10) {
        console.warn(`[AntiScraping] 机器人行为检测: ${ip}`);
        blacklistIP(ip, '机器人行为模式');
        return res.status(403).json({
          success: false,
          code: 'BOT_DETECTED',
          message: '检测到异常行为'
        });
      }
    }
    
    record.lastAccess = now;
    record.requestCount++;
    record.accessPattern.push(now);
    
    // 限制存储的访问记录数量
    if (record.accessPattern.length > 100) {
      record.accessPattern = record.accessPattern.slice(-50);
    }
  }
  
  next();
}

/**
 * 添加IP到黑名单
 */
function blacklistIP(ip, reason = '手动封禁') {
  blacklist.add(ip);
  console.log(`[AntiScraping] IP加入黑名单: ${ip} - 原因: ${reason}`);
  
  // 存储到持久化（可根据需要实现）
  return { ip, reason, timestamp: Date.now() };
}

/**
 * 从黑名单移除IP
 */
function unblacklistIP(ip) {
  blacklist.delete(ip);
  console.log(`[AntiScraping] IP移出黑名单: ${ip}`);
  return true;
}

/**
 * 获取黑名单列表
 */
function getBlacklist() {
  return Array.from(blacklist);
}

/**
 * 清空黑名单
 */
function clearBlacklist() {
  blacklist.clear();
  return true;
}

/**
 * 获取IP访问统计
 */
function getIPStats(ip) {
  const record = ipStore.get(ip);
  if (!record) return null;
  
  return {
    ip,
    firstAccess: record.firstAccess,
    lastAccess: record.lastAccess,
    requestCount: record.requestCount,
    accessPattern: record.accessPattern.length
  };
}

/**
 * 验证码触发检测
 */
function shouldTriggerCaptcha(req) {
  const ip = getClientIP(req);
  const record = ipStore.get(ip);
  
  if (!record) return false;
  
  // 触发条件：1分钟内访问超过80次
  if (record.requestCount > CONFIG.ipLimit.max * 0.8) {
    return true;
  }
  
  // 触发条件：短时间内大量不同路径访问
  const uniquePaths = new Set(record.accessPattern);
  if (uniquePaths.size > CONFIG.ipLimit.max * 0.6) {
    return true;
  }
  
  return false;
}

/**
 * 导出所有中间件和工具函数
 */
module.exports = {
  // 中间件
  ipLimiter: createIPLimiter,
  userLimiter: createUserLimiter,
  apiLimiter: createApiLimiter,
  checkUserAgent,
  behaviorAnalysis,
  
  // 工具函数
  blacklistIP,
  unblacklistIP,
  getBlacklist,
  clearBlacklist,
  getIPStats,
  shouldTriggerCaptcha,
  getClientIP,
  getUserIdentifier,
  
  // 配置
  CONFIG,
  blacklist
};
