/**
 * 验证码API路由
 */

const express = require('express');
const router = express.Router();
const {
  generateImageCaptcha,
  verifyImageCaptcha,
  generateSliderCaptcha,
  verifySliderCaptcha,
  getCaptchaStatus,
  generateVerificationToken,
  verifyToken
} = require('../middleware/captcha');

/**
 * 生成图形验证码
 * GET /api/captcha/image
 */
router.get('/image', (req, res) => {
  try {
    const captcha = generateImageCaptcha();
    
    // 生成验证码图片（这里返回SVG，实际项目中可使用canvas）
    const svgCode = generateCaptchaSVG(captcha.code);
    
    res.json({
      success: true,
      captchaId: captcha.id,
      expiresAt: captcha.expiresAt,
      expiresIn: captcha.expiresIn,
      image: `data:image/svg+xml;base64,${Buffer.from(svgCode).toString('base64')}`
    });
  } catch (error) {
    console.error('[Captcha] 生成验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证码生成失败'
    });
  }
});

/**
 * 生成滑块验证码
 * GET /api/captcha/slider
 */
router.get('/slider', (req, res) => {
  try {
    const captcha = generateSliderCaptcha();
    
    // 生成背景图和滑块图（实际项目需要canvas生成）
    res.json({
      success: true,
      captchaId: captcha.id,
      expiresAt: captcha.expiresAt,
      expiresIn: captcha.expiresIn,
      config: captcha.config,
      backgroundImage: '/api/captcha/slider/background/' + captcha.id,
      sliderImage: '/api/captcha/slider/slider/' + captcha.id
    });
  } catch (error) {
    console.error('[Captcha] 生成滑块验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '滑块验证码生成失败'
    });
  }
});

/**
 * 验证验证码
 * POST /api/captcha/verify
 */
router.post('/verify', (req, res) => {
  const { captchaId, code, sliderPosition } = req.body;
  
  if (!captchaId) {
    return res.status(400).json({
      success: false,
      message: '缺少验证码ID'
    });
  }
  
  // 根据参数判断验证类型
  if (sliderPosition !== undefined) {
    // 滑块验证
    const result = verifySliderCaptcha(captchaId, sliderPosition);
    
    if (result.success) {
      const token = generateVerificationToken(captchaId);
      return res.json({
        success: true,
        message: '验证成功',
        token
      });
    }
    
    return res.status(400).json({
      success: false,
      message: result.reason,
      hint: result.hint
    });
  } else if (code) {
    // 图形验证码验证
    const result = verifyImageCaptcha(captchaId, code);
    
    if (result.success) {
      const token = generateVerificationToken(captchaId);
      return res.json({
        success: true,
        message: '验证成功',
        token
      });
    }
    
    return res.status(400).json({
      success: false,
      message: result.reason
    });
  }
  
  return res.status(400).json({
    success: false,
    message: '缺少验证参数'
  });
});

/**
 * 获取验证码状态
 * GET /api/captcha/status/:id
 */
router.get('/status/:id', (req, res) => {
  const status = getCaptchaStatus(req.params.id);
  
  if (!status.exists) {
    return res.status(404).json({
      success: false,
      message: '验证码不存在'
    });
  }
  
  res.json({
    success: true,
    ...status
  });
});

/**
 * 验证Token
 * POST /api/captcha/verify-token
 */
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: '缺少Token'
    });
  }
  
  const result = verifyToken(token);
  
  if (result.valid) {
    return res.json({
      success: true,
      valid: true,
      type: result.type
    });
  }
  
  res.status(400).json({
    success: false,
    valid: false,
    message: result.reason
  });
});

/**
 * 生成简单的SVG验证码
 */
function generateCaptchaSVG(code) {
  const width = 120;
  const height = 40;
  
  // 生成干扰线
  let lines = '';
  for (let i = 0; i < 3; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#999" stroke-width="1"/>`;
  }
  
  // 生成干扰点
  let dots = '';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    dots += `<circle cx="${x}" cy="${y}" r="1" fill="#666"/>`;
  }
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      ${lines}
      ${dots}
      <text x="20" y="28" font-family="Arial" font-size="24" fill="#333">
        ${code.split('').map((char, i) => 
          `<tspan x="${20 + i * 22}" y="${25 + Math.random() * 10}">${char}</tspan>`
        ).join('')}
      </text>
    </svg>
  `;
}

module.exports = router;
