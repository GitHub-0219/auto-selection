/**
 * IP黑名单管理 - IP Blacklist Manager
 * 功能：IP封禁、解禁、IP段封禁、白名单管理
 */

const crypto = require('crypto');

// 内存存储
const blacklist = new Map();  // ip -> { reason, timestamp, expiresAt, addedBy }
const whitelist = new Set();  // 永久白名单
const temporaryBlocks = new Map();  // 临时封禁

// 配置
const CONFIG = {
  defaultBlockDuration: 3600000,      // 默认封禁时长（1小时）
  maxBlockDuration: 86400000,         // 最大封禁时长（24小时）
  autoBlockThreshold: 50,            // 触发自动封禁的异常次数
  cleanupInterval: 300000            // 清理间隔（5分钟）
};

/**
 * 封禁单个IP
 */
function blockIP(ip, options = {}) {
  const {
    reason = '手动封禁',
    duration = CONFIG.defaultBlockDuration,
    addedBy = 'system'
  } = options;
  
  const now = Date.now();
  const expiresAt = duration > 0 ? now + duration : null;
  
  blacklist.set(ip, {
    reason,
    timestamp: now,
    expiresAt,
    addedBy,
    type: duration > 0 ? 'temporary' : 'permanent'
  });
  
  // 如果是临时封禁，设置自动删除
  if (duration > 0) {
    temporaryBlocks.set(ip, setTimeout(() => {
      unblockIP(ip);
    }, duration));
  }
  
  console.log(`[Blacklist] IP被封禁: ${ip} - 原因: ${reason} - 有效期: ${duration > 0 ? `${duration/1000}秒` : '永久'}`);
  
  return {
    ip,
    reason,
    timestamp: now,
    expiresAt,
    permanent: duration <= 0
  };
}

/**
 * 解禁IP
 */
function unblockIP(ip) {
  const blocked = blacklist.get(ip);
  
  if (blocked && temporaryBlocks.has(ip)) {
    clearTimeout(temporaryBlocks.get(ip));
    temporaryBlocks.delete(ip);
  }
  
  const existed = blacklist.delete(ip);
  
  console.log(`[Blacklist] IP被解禁: ${ip} - existed: ${existed}`);
  
  return { ip, existed };
}

/**
 * 检查IP是否在黑名单中
 */
function isBlocked(ip) {
  const block = blacklist.get(ip);
  
  if (!block) return false;
  
  // 检查是否过期
  if (block.expiresAt && block.expiresAt < Date.now()) {
    unblockIP(ip);
    return false;
  }
  
  return true;
}

/**
 * 检查IP是否在白名单中
 */
function isWhitelisted(ip) {
  return whitelist.has(ip);
}

/**
 * 添加IP到白名单
 */
function addToWhitelist(ip, note = '') {
  whitelist.add(ip);
  console.log(`[Blacklist] IP添加到白名单: ${ip} - 备注: ${note}`);
  return { ip, whitelisted: true };
}

/**
 * 从白名单移除
 */
function removeFromWhitelist(ip) {
  const existed = whitelist.has(ip);
  whitelist.delete(ip);
  return { ip, removed: existed };
}

/**
 * 批量封禁IP
 */
function blockIPs(ips, options = {}) {
  const results = ips.map(ip => blockIP(ip, options));
  return {
    blocked: results.length,
    details: results
  };
}

/**
 * 批量解禁IP
 */
function unblockIPs(ips) {
  const results = ips.map(ip => unblockIP(ip));
  return {
    unblocked: results.filter(r => r.existed).length,
    details: results
  };
}

/**
 * 封禁IP段
 */
function blockIPRange(startIP, endIP, options = {}) {
  const start = ipToNumber(startIP);
  const end = ipToNumber(endIP);
  
  if (start === -1 || end === -1 || start > end) {
    return { success: false, reason: '无效的IP范围' };
  }
  
  const blockedIPs = [];
  for (let i = start; i <= end && i <= start + 10000; i++) {  // 最多封禁10000个IP
    const ip = numberToIP(i);
    blockIP(ip, options);
    blockedIPs.push(ip);
  }
  
  return {
    success: true,
    count: blockedIPs.length,
    range: `${startIP} - ${endIP}`,
    details: blockedIPs.slice(0, 10) // 只返回前10个示例
  };
}

/**
 * 封禁CIDR网段
 */
function blockCIDR(cidr, options = {}) {
  const [ip, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength);
  
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    return { success: false, reason: '无效的CIDR格式' };
  }
  
  const start = ipToNumber(ip);
  const mask = ~((1 << (32 - prefix)) - 1);
  const startIP = start & mask;
  const endIP = startIP | ~mask;
  
  return blockIPRange(numberToIP(startIP), numberToIP(endIP), options);
}

/**
 * 自动封禁（基于异常行为）
 */
function autoBlock(ip, reason, severity = 'medium') {
  // 已经是白名单则不封禁
  if (isWhitelisted(ip)) {
    return { blocked: false, reason: 'IP在白名单中' };
  }
  
  // 已经是黑名单则更新原因
  if (isBlocked(ip)) {
    const block = blacklist.get(ip);
    block.reason = reason;
    return { blocked: true, reason: 'IP已在黑名单中', updated: true };
  }
  
  // 根据严重程度决定封禁时长
  const durationMap = {
    low: 300000,      // 5分钟
    medium: 3600000,  // 1小时
    high: 14400000,  // 4小时
    critical: 86400000  // 24小时
  };
  
  const duration = durationMap[severity] || CONFIG.defaultBlockDuration;
  
  return {
    ...blockIP(ip, {
      reason: `[自动封禁] ${reason}`,
      duration,
      addedBy: 'auto-block'
    }),
    autoBlocked: true,
    severity
  };
}

/**
 * 获取黑名单列表
 */
function getBlacklist(options = {}) {
  const { includeExpired = false } = options;
  const now = Date.now();
  const result = [];
  
  for (const [ip, block] of blacklist.entries()) {
    if (!includeExpired && block.expiresAt && block.expiresAt < now) {
      continue;
    }
    
    result.push({
      ip,
      ...block,
      remainingTime: block.expiresAt ? Math.max(0, block.expiresAt - now) : null
    });
  }
  
  return {
    total: result.length,
    list: result
  };
}

/**
 * 获取白名单列表
 */
function getWhitelist() {
  return {
    total: whitelist.size,
    list: Array.from(whitelist)
  };
}

/**
 * 导出黑名单
 */
function exportBlacklist() {
  const data = {
    exportedAt: new Date().toISOString(),
    blacklist: Array.from(blacklist.entries()).map(([ip, block]) => ({
      ip,
      ...block
    })),
    whitelist: Array.from(whitelist)
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * 导入黑名单
 */
function importBlacklist(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    let imported = 0;
    
    if (data.blacklist) {
      for (const item of data.blacklist) {
        if (item.ip) {
          blockIP(item.ip, {
            reason: item.reason || '导入',
            duration: item.expiresAt ? item.expiresAt - Date.now() : 0,
            addedBy: 'import'
          });
          imported++;
        }
      }
    }
    
    if (data.whitelist) {
      for (const ip of data.whitelist) {
        addToWhitelist(ip, '导入');
      }
    }
    
    return { success: true, imported };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * 清理过期封禁记录
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [ip, block] of blacklist.entries()) {
    if (block.expiresAt && block.expiresAt < now) {
      unblockIP(ip);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Blacklist] 清理了 ${cleaned} 个过期封禁记录`);
  }
  
  return { cleaned };
}

/**
 * IP转数字
 */
function ipToNumber(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return -1;
  
  return parts.reduce((acc, part) => {
    const num = parseInt(part);
    if (isNaN(num) || num < 0 || num > 255) return -1;
    return (acc << 8) + num;
  }, 0);
}

/**
 * 数字转IP
 */
function numberToIP(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

// 启动自动清理
setInterval(cleanup, CONFIG.cleanupInterval);

module.exports = {
  // 基础操作
  blockIP,
  unblockIP,
  isBlocked,
  
  // 白名单
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelist,
  
  // 批量操作
  blockIPs,
  unblockIPs,
  blockIPRange,
  blockCIDR,
  
  // 自动封禁
  autoBlock,
  
  // 查询
  getBlacklist,
  getWhitelist,
  
  // 导入导出
  exportBlacklist,
  importBlacklist,
  
  // 维护
  cleanup,
  
  // 工具
  ipToNumber,
  numberToIP,
  
  // 配置
  CONFIG
};
