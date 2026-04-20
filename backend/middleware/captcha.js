/**
 * 验证码模块 - CAPTCHA Verification
 * 功能：图形验证码生成、滑块验证、验证状态管理
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// 内存存储（生产环境建议使用Redis）
const captchaStore = new Map();

// 配置
const CONFIG = {
  expireTime: 300,        // 验证码过期时间（秒）
  maxAttempts: 5,         // 最大验证尝试次数
  cleanInterval: 60000,   // 清理过期验证码间隔（毫秒）
  
  // 图形验证码配置
  imageCaptcha: {
    width: 120,
    height: 40,
    length: 4,
    chars: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  },
  
  // 滑块验证码配置
  sliderCaptcha: {
    canvasWidth: 280,
    canvasHeight: 150,
    sliderSize: 40,
    threshold: 10  // 允许的误差范围
  }
};

// 验证码类型
const CAPTCHA_TYPE = {
  IMAGE: 'image',
  SLIDER: 'slider'
};

/**
 * 生成随机字符串
 */
function generateRandomString(length = 4, chars = CONFIG.imageCaptcha.chars) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成图形验证码
 */
function generateImageCaptcha() {
  const captchaId = uuidv4();
  const code = generateRandomString(CONFIG.imageCaptcha.length);
  const expiresAt = Date.now() + CONFIG.expireTime * 1000;
  
  // 生成干扰点
  const dots = [];
  for (let i = 0; i < 50; i++) {
    dots.push({
      x: Math.random() * CONFIG.imageCaptcha.width,
      y: Math.random() * CONFIG.imageCaptcha.height,
      color: Math.random() > 0.5 ? '#666' : '#999'
    });
  }
  
  // 生成干扰线
  const lines = [];
  for (let i = 0; i < 3; i++) {
    lines.push({
      x1: Math.random() * CONFIG.imageCaptcha.width,
      y1: Math.random() * CONFIG.imageCaptcha.height,
      x2: Math.random() * CONFIG.imageCaptcha.width,
      y2: Math.random() * CONFIG.imageCaptcha.height,
      color: Math.random() > 0.5 ? '#777' : '#aaa'
    });
  }
  
  const captcha = {
    id: captchaId,
    type: CAPTCHA_TYPE.IMAGE,
    code: code,
    expiresAt,
    attempts: 0,
    verified: false,
    data: { dots, lines }
  };
  
  captchaStore.set(captchaId, captcha);
  
  return {
    captchaId,
    expiresAt,
    expiresIn: CONFIG.expireTime
  };
}

/**
 * 验证图形验证码
 */
function verifyImageCaptcha(captchaId, userCode) {
  const captcha = captchaStore.get(captchaId);
  
  if (!captcha) {
    return { success: false, reason: '验证码不存在' };
  }
  
  if (captcha.expiresAt < Date.now()) {
    captchaStore.delete(captchaId);
    return { success: false, reason: '验证码已过期' };
  }
  
  if (captcha.verified) {
    return { success: false, reason: '验证码已使用' };
  }
  
  captcha.attempts++;
  
  if (captcha.attempts > CONFIG.maxAttempts) {
    captchaStore.delete(captchaId);
    return { success: false, reason: '验证次数过多' };
  }
  
  if (userCode.toLowerCase() !== captcha.code.toLowerCase()) {
    return { success: false, reason: '验证码错误' };
  }
  
  captcha.verified = true;
  
  return { success: true, reason: '验证成功' };
}

/**
 * 生成滑块验证码
 */
function generateSliderCaptcha() {
  const captchaId = uuidv4();
  const targetPosition = Math.floor(Math.random() * (CONFIG.sliderCaptcha.canvasWidth - CONFIG.sliderCaptcha.sliderSize - 40)) + 20;
  const expiresAt = Date.now() + CONFIG.expireTime * 1000;
  
  const captcha = {
    id: captchaId,
    type: CAPTCHA_TYPE.SLIDER,
    targetPosition,
    expiresAt,
    attempts: 0,
    verified: false,
    verifiedAt: null
  };
  
  captchaStore.set(captchaId, captcha);
  
  return {
    captchaId,
    targetPosition: 0,  // 不返回真实位置
    expiresAt,
    expiresIn: CONFIG.expireTime,
    config: {
      canvasWidth: CONFIG.sliderCaptcha.canvasWidth,
      canvasHeight: CONFIG.sliderCaptcha.canvasHeight,
      sliderSize: CONFIG.sliderCaptcha.sliderSize
    }
  };
}

/**
 * 验证滑块验证码
 */
function verifySliderCaptcha(captchaId, sliderPosition) {
  const captcha = captchaStore.get(captchaId);
  
  if (!captcha) {
    return { success: false, reason: '验证码不存在' };
  }
  
  if (captcha.expiresAt < Date.now()) {
    captchaStore.delete(captchaId);
    return { success: false, reason: '验证码已过期' };
  }
  
  if (captcha.verified) {
    return { success: false, reason: '验证码已使用' };
  }
  
  captcha.attempts++;
  
  if (captcha.attempts > CONFIG.maxAttempts) {
    captchaStore.delete(captchaId);
    return { success: false, reason: '验证次数过多' };
  }
  
  const diff = Math.abs(sliderPosition - captcha.targetPosition);
  
  if (diff > CONFIG.sliderCaptcha.threshold) {
    return {
      success: false,
      reason: '滑块位置不正确',
      hint: sliderPosition < captcha.targetPosition ? 'left' : 'right'
    };
  }
  
  captcha.verified = true;
  captcha.verifiedAt = Date.now();
  
  return { success: true, reason: '验证成功' };
}

/**
 * 获取验证码状态
 */
function getCaptchaStatus(captchaId) {
  const captcha = captchaStore.get(captchaId);
  
  if (!captcha) {
    return { exists: false };
  }
  
  return {
    exists: true,
    type: captcha.type,
    verified: captcha.verified,
    expired: captcha.expiresAt < Date.now(),
    attempts: captcha.attempts,
    remainingAttempts: CONFIG.maxAttempts - captcha.attempts
  };
}

/**
 * 删除验证码
 */
function deleteCaptcha(captchaId) {
  return captchaStore.delete(captchaId);
}

/**
 * 清理过期验证码
 */
function cleanExpiredCaptchas() {
  const now = Date.now();
  let count = 0;
  
  for (const [id, captcha] of captchaStore.entries()) {
    if (captcha.expiresAt < now || captcha.verified) {
      captchaStore.delete(id);
      count++;
    }
  }
  
  if (count > 0) {
    console.log(`[Captcha] 清理了 ${count} 个过期验证码`);
  }
  
  return count;
}

/**
 * 生成验证Token
 */
function generateVerificationToken(captchaId) {
  const captcha = captchaStore.get(captchaId);
  
  if (!captcha || !captcha.verified) {
    return null;
  }
  
  const payload = {
    captchaId,
    verifiedAt: captcha.verifiedAt,
    type: captcha.type
  };
  
  const token = crypto
    .createHmac('sha256', process.env.CAPTCHA_SECRET || 'captcha-secret')
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `${captchaId}.${token}`;
}

/**
 * 验证Token
 */
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: '无效的Token格式' };
  }
  
  const [captchaId, receivedToken] = parts;
  const captcha = captchaStore.get(captchaId);
  
  if (!captcha || !captcha.verified) {
    return { valid: false, reason: '验证码未验证' };
  }
  
  const payload = {
    captchaId,
    verifiedAt: captcha.verifiedAt,
    type: captcha.type
  };
  
  const expectedToken = crypto
    .createHmac('sha256', process.env.CAPTCHA_SECRET || 'captcha-secret')
    .update(JSON.stringify(payload))
    .digest('hex');
  
  if (receivedToken !== expectedToken) {
    return { valid: false, reason: 'Token验证失败' };
  }
  
  // Token有效期与验证码相同
  if (captcha.expiresAt < Date.now()) {
    return { valid: false, reason: 'Token已过期' };
  }
  
  return {
    valid: true,
    captchaId,
    type: captcha.type
  };
}

// 启动自动清理
setInterval(cleanExpiredCaptchas, CONFIG.cleanInterval);

// 初始化时清理一次
cleanExpiredCaptchas();

module.exports = {
  // 验证码类型
  CAPTCHA_TYPE,
  
  // 图形验证码
  generateImageCaptcha,
  verifyImageCaptcha,
  
  // 滑块验证码
  generateSliderCaptcha,
  verifySliderCaptcha,
  
  // 状态管理
  getCaptchaStatus,
  deleteCaptcha,
  cleanExpiredCaptchas,
  
  // Token管理
  generateVerificationToken,
  verifyToken,
  
  // 配置
  CONFIG
};
