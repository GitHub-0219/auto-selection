# Auto选品后端 API 文档

## 项目概览

- **项目名**: Auto选品 (AI跨境新手加速器)
- **技术栈**: NestJS + PostgreSQL + Redis
- **版本**: 0.1.0

---

## 模块列表

### 1. AI模块 (`/ai`)

#### 1.1 获取AI能力列表
```
GET /ai/capabilities
```

**响应**:
```json
{
  "success": true,
  "data": {
    "features": [
      { "id": "selection-report", "name": "智能选品报告", "endpoint": "/ai/selection-report" },
      { "id": "translate", "name": "多语言翻译", "endpoint": "/ai/translate" },
      { "id": "batch-translate", "name": "批量翻译", "endpoint": "/ai/batch-translate" },
      { "id": "video-script", "name": "视频脚本生成", "endpoint": "/ai/video-script" }
    ],
    "supportedLanguages": [
      { "code": "en", "name": "English", "flag": "🇺🇸" },
      { "code": "zh", "name": "中文", "flag": "🇨🇳" }
      // ... 15种语言
    ]
  }
}
```

#### 1.2 生成选品报告 (需认证)
```
POST /ai/selection-report
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "keywords": ["蓝牙耳机", "无线耳机"],
  "targetMarket": "北美",
  "budget": 10000
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "summary": "市场概述...",
    "products": [
      {
        "name": "无线蓝牙耳机 旗舰版",
        "nicheScore": 85,
        "trend": "上升",
        "competition": "中",
        "avgPrice": 299.00,
        "profitMargin": 35,
        "monthlyDemand": 5000,
        "topPlatforms": ["Amazon", "TikTok Shop"],
        "recommendation": "中等预算可入场"
      }
    ],
    "marketInsights": ["洞察1", "洞察2"],
    "riskAssessment": "风险评估...",
    "actionPlan": ["行动1", "行动2"]
  }
}
```

#### 1.3 多语言翻译 (需认证)
```
POST /ai/translate
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "content": "高质量蓝牙耳机，支持降噪功能",
  "targetLang": "en"
}
```

**支持的语种**:
- `en` - English 🇺🇸
- `zh` - 中文 🇨🇳
- `ja` - 日本語 🇯🇵
- `ko` - 한국어 🇰🇷
- `de` - Deutsch 🇩🇪
- `fr` - Français 🇫🇷
- `es` - Español 🇪🇸
- `pt` - Português 🇵🇹
- `it` - Italiano 🇮🇹
- `ru` - Русский 🇷🇺
- `ar` - العربية 🇸🇦
- `hi` - हिन्दी 🇮🇳
- `th` - ไทย 🇹🇭
- `vi` - Tiếng Việt 🇻🇳
- `id` - Bahasa Indonesia 🇮🇩

#### 1.4 批量翻译 (需认证，基础会员+)
```
POST /ai/batch-translate
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "items": [
    { "text": "产品名称", "type": "title" },
    { "text": "详细描述内容", "type": "description" },
    { "text": "关键词1,关键词2", "type": "tags" }
  ],
  "targetLang": "en"
}
```

#### 1.5 视频脚本生成 (需认证，基础会员+)
```
POST /ai/video-script
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "productName": "无线蓝牙耳机",
  "productDescription": "降噪、长续航、高音质",
  "targetPlatform": "tiktok",
  "targetAudience": "18-35岁年轻消费者",
  "duration": 60
}
```

**支持的平台**:
- `tiktok` - TikTok
- `youtube` - YouTube Shorts
- `instagram` - Instagram Reels

#### 1.6 AI对话 (需认证)
```
POST /ai/chat
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "message": "如何选择跨境电商产品？"
}
```

---

### 2. 支付模块 (`/payment`)

#### 2.1 获取订阅方案
```
GET /payment/plans
```

**响应**:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "planId": "basic",
        "name": "基础会员",
        "price": 9.9,
        "periodDays": 30,
        "features": ["每日10次选品报告", "每日50次翻译"]
      }
    ],
    "periodOptions": [
      { "period": "weekly", "name": "周付", "discount": 1.0 },
      { "period": "monthly", "name": "月付", "discount": 1.0 },
      { "period": "quarterly", "name": "季付", "discount": 0.9, "popular": true },
      { "period": "yearly", "name": "年付", "discount": 0.7, "bestValue": true }
    ]
  }
}
```

#### 2.2 创建订阅订单 (需认证)
```
POST /payment/subscribe
Authorization: Bearer <token>
```

**请求体** (微信支付):
```json
{
  "planId": "pro",
  "period": "monthly",
  "provider": "wechat",
  "channel": "native"
}
```

**请求体** (支付宝):
```json
{
  "planId": "pro",
  "period": "yearly",
  "provider": "alipay",
  "channel": "web"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "orderId": "SUB1234567890",
    "paymentId": "WX1234567890",
    "paymentUrl": "https://qr.alipay.com/xxx",
    "qrCode": "weixin://wxpay/bizpayurl?pr=xxx",
    "amount": 29.9,
    "expiredAt": "2024-12-09T12:00:00.000Z"
  }
}
```

#### 2.3 获取订阅状态 (需认证)
```
GET /payment/subscription
Authorization: Bearer <token>
```

#### 2.4 取消订阅 (需认证)
```
POST /payment/subscription/cancel
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "immediate": "false"
}
```

#### 2.5 恢复自动续费 (需认证)
```
POST /payment/subscription/resume
Authorization: Bearer <token>
```

#### 2.6 微信支付回调
```
POST /payment/wechat/notify
```

#### 2.7 支付宝回调
```
POST /payment/alipay/notify
```

#### 2.8 申请退款 (需认证)
```
POST /payment/refund
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "paymentId": "WX1234567890",
  "reason": "不想要了"
}
```

#### 2.9 获取支付历史 (需认证)
```
GET /payment/history
Authorization: Bearer <token>
```

---

### 3. 邀请模块 (`/invite`)

#### 3.1 获取我的邀请码 (需认证)
```
GET /invite/code
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "code": "ABC12345",
    "expiresAt": "2024-12-09T12:00:00.000Z",
    "rewardAmount": 10,
    "usageLimit": 1
  }
}
```

#### 3.2 生成邀请码 (需认证)
```
POST /invite/code
Authorization: Bearer <token>
```

#### 3.3 使用邀请码 (需认证)
```
POST /invite/use
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "code": "ABC12345"
}
```

**响应**:
```json
{
  "success": true,
  "message": "邀请码使用成功",
  "data": {
    "reward": {
      "inviterReward": 10,
      "inviteeReward": 5
    }
  }
}
```

#### 3.4 验证邀请码
```
GET /invite/validate/:code
```

#### 3.5 获取邀请记录 (需认证)
```
GET /invite/records
Authorization: Bearer <token>
```

---

### 4. 积分模块 (`/points`)

#### 4.1 获取积分余额 (需认证)
```
GET /points/balance
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "balance": 1000,
    "pendingPoints": 0,
    "expiringPoints": 100,
    "expiryDate": "2024-12-31T00:00:00.000Z"
  }
}
```

#### 4.2 获取积分明细 (需认证)
```
GET /points/transactions
Authorization: Bearer <token>
```

#### 4.3 积分抵现计算
```
GET /points/calculate/:points
```

#### 4.4 获取积分规则
```
GET /points/rules
```

---

### 5. 用户模块 (`/user`)

#### 5.1 用户注册
```
POST /user/register
```

#### 5.2 用户登录
```
POST /user/login
```

#### 5.3 获取当前用户信息 (需认证)
```
GET /user/me
Authorization: Bearer <token>
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或Token过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 环境变量

详见 `.env.example` 文件

### 必需的环境变量
- `DATABASE_URL` - PostgreSQL数据库连接
- `JWT_SECRET` - JWT签名密钥
- `SILICONFLOW_API_KEY` - 硅基流动API密钥

### 微信支付环境变量
- `WECHAT_MCH_ID` - 商户号
- `WECHAT_MCH_KEY` - API密钥
- `WECHAT_APP_ID` - 应用ID
- `WECHAT_NOTIFY_URL` - 支付回调地址

### 支付宝环境变量
- `ALIPAY_APP_ID` - 应用ID
- `ALIPAY_PRIVATE_KEY` - 应用私钥
- `ALIPAY_PUBLIC_KEY` - 支付宝公钥
- `ALIPAY_NOTIFY_URL` - 支付回调地址
