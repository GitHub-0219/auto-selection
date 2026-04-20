/**
 * 数据加密与签名模块 - Data Encryption & Signature
 * 功能：API响应加密、敏感字段脱敏、前端签名验证
 */

const crypto = require('crypto');

// 配置
const CONFIG = {
  // AES加密配置
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  
  // API签名配置
  signatureSecret: process.env.SIGNATURE_SECRET || 'auto-select-secret-key-2024',
  signatureExpire: 300,  // 签名过期时间（秒）
  
  // 脱敏配置
  sensitiveFields: [
    'password', 'token', 'secret', 'apiKey', 'api_key',
    'phone', 'mobile', 'email', 'idCard', 'id_card',
    'bankCard', 'bank_card', 'address', 'realName'
  ]
};

/**
 * AES加密
 */
function encrypt(plaintext, secretKey = CONFIG.signatureSecret) {
  try {
    const key = crypto.scryptSync(secretKey, 'salt', CONFIG.keyLength);
    const iv = crypto.randomBytes(CONFIG.ivLength);
    const cipher = crypto.createCipheriv(CONFIG.algorithm, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('[Encryption] 加密失败:', error.message);
    return null;
  }
}

/**
 * AES解密
 */
function decrypt(encryptedData, iv, authTag, secretKey = CONFIG.signatureSecret) {
  try {
    const key = crypto.scryptSync(secretKey, 'salt', CONFIG.keyLength);
    const decipher = crypto.createDecipheriv(
      CONFIG.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] 解密失败:', error.message);
    return null;
  }
}

/**
 * 加密JSON对象
 */
function encryptObject(obj, secretKey) {
  const jsonStr = JSON.stringify(obj);
  return encrypt(jsonStr, secretKey);
}

/**
 * 解密JSON对象
 */
function decryptObject(encrypted, iv, authTag, secretKey) {
  const jsonStr = decrypt(encrypted, iv, authTag, secretKey);
  if (!jsonStr) return null;
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[Encryption] JSON解析失败:', error.message);
    return null;
  }
}

/**
 * 生成API签名
 */
function generateSignature(params, timestamp = Date.now()) {
  // 1. 按字典序排序参数
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 2. 组合签名字符串
  const fullString = `${timestamp}:${signString}`;
  
  // 3. HMAC-SHA256签名
  const signature = crypto
    .createHmac('sha256', CONFIG.signatureSecret)
    .update(fullString)
    .digest('hex');
  
  return {
    signature,
    timestamp,
    expire: CONFIG.signatureExpire
  };
}

/**
 * 验证API签名
 */
function verifySignature(params, signature, timestamp) {
  // 检查时间戳是否过期
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  if (isNaN(requestTime)) {
    return { valid: false, reason: '无效的时间戳' };
  }
  
  if (now - requestTime > CONFIG.signatureExpire * 1000) {
    return { valid: false, reason: '签名已过期' };
  }
  
  // 重新生成签名进行比对
  const expected = generateSignature(params, requestTime);
  
  // 使用时间安全的比较
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected.signature, 'hex');
  
  if (sigBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: '签名长度不匹配' };
  }
  
  const valid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  
  return {
    valid,
    reason: valid ? '签名验证通过' : '签名不匹配'
  };
}

/**
 * 敏感字段脱敏
 */
function maskSensitiveData(data, fields = CONFIG.sensitiveFields) {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, fields));
  }
  
  if (typeof data === 'object') {
    const masked = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // 检查是否需要脱敏
      const shouldMask = fields.some(field => lowerKey.includes(field.toLowerCase()));
      
      if (shouldMask && typeof value === 'string') {
        masked[key] = maskString(value);
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value, fields);
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }
  
  return data;
}

/**
 * 字符串脱敏
 */
function maskString(str) {
  if (!str || str.length < 2) return '***';
  
  const len = str.length;
  
  // 手机号：138****5678
  if (/^1[3-9]\d{9}$/.test(str)) {
    return str.slice(0, 3) + '****' + str.slice(-4);
  }
  
  // 邮箱：t***@example.com
  if (str.includes('@')) {
    const [local, domain] = str.split('@');
    if (local.length > 1) {
      return local.slice(0, 1) + '***@' + domain;
    }
    return '***@' + domain;
  }
  
  // 银行卡：****1234
  if (/^\d{16,19}$/.test(str)) {
    return '****' + str.slice(-4);
  }
  
  // 身份证：110***********1234
  if (/^\d{15}|\d{17}[\dXx]$/.test(str)) {
    return str.slice(0, 3) + '***********' + str.slice(-4);
  }
  
  // 普通字符串：保留首尾字符
  if (len <= 4) {
    return '*'.repeat(len);
  }
  
  return str.slice(0, 2) + '*'.repeat(len - 4) + str.slice(-2);
}

/**
 * 生成请求ID
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 数据哈希（不可逆）
 */
function hashData(data) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * 响应加密包装器
 */
function encryptedResponse(data, options = {}) {
  const { encrypt: shouldEncrypt = true, mask = true } = options;
  
  let processedData = data;
  
  // 脱敏处理
  if (mask) {
    processedData = maskSensitiveData(processedData);
  }
  
  // 加密处理
  if (shouldEncrypt && encryptObject) {
    const encrypted = encryptObject(processedData);
    if (encrypted) {
      return {
        success: true,
        data: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        masked: true
      };
    }
  }
  
  return {
    success: true,
    data: processedData
  };
}

/**
 * 请求解密验证
 */
function verifyRequest(req, options = {}) {
  const { requireSignature = true } = options;
  
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // 验证签名
  if (requireSignature) {
    if (!signature || !timestamp) {
      return {
        valid: false,
        reason: '缺少签名参数',
        requestId
      };
    }
    
    const params = {
      ...req.query,
      ...req.body
    };
    
    const result = verifySignature(params, signature, timestamp);
    if (!result.valid) {
      return {
        valid: false,
        reason: result.reason,
        requestId
      };
    }
  }
  
  return {
    valid: true,
    requestId
  };
}

module.exports = {
  // 加密解密
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  
  // 签名
  generateSignature,
  verifySignature,
  
  // 脱敏
  maskSensitiveData,
  maskString,
  
  // 工具
  generateRequestId,
  hashData,
  encryptedResponse,
  verifyRequest,
  
  // 配置
  CONFIG
};
