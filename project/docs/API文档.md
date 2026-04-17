# Auto选品 - API 文档

本文档详细说明了 Auto选品 平台的所有 API 接口，包括请求格式、响应格式和示例。

---

## 📋 目录

- [基础信息](#基础信息)
- [认证接口](#认证接口)
- [用户接口](#用户接口)
- [AI选品接口](#ai选品接口)
- [翻译接口](#翻译接口)
- [定价接口](#定价接口)
- [积分接口](#积分接口)
- [错误码说明](#错误码说明)

---

## 基础信息

### Base URL

```
开发环境: http://localhost:3001/api/v1
生产环境: https://api.auto-selection.com/api/v1
```

### 认证方式

除公开接口外，所有 API 请求都需要在 Header 中携带 Token：

```
Authorization: Bearer <your_jwt_token>
```

### 请求格式

```typescript
// 请求头
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>"  // 除公开接口外必填
}

// 请求体 (POST/PUT/PATCH)
{
  "key": "value"
}
```

### 响应格式

```typescript
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// 分页响应
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ... ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}

// 错误响应
{
  "code": 1001,
  "message": "错误描述",
  "data": null
}
```

---

## 认证接口

### 1. 用户注册

**POST** `/auth/register`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 (8-32位) |
| name | string | ✅ | 用户昵称 |
| captcha | string | ✅ | 验证码 |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "张三",
    "captcha": "123456"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "userId": "usr_123456",
    "email": "user@example.com",
    "name": "张三",
    "avatar": null,
    "memberLevel": "free",
    "points": 100,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 用户登录

**POST** `/auth/login`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "user": {
      "userId": "usr_123456",
      "email": "user@example.com",
      "name": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "memberLevel": "free",
      "points": 100
    }
  }
}
```

---

### 3. 退出登录

**POST** `/auth/logout`

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "退出成功",
  "data": null
}
```

---

## 用户接口

### 4. 获取用户信息

**GET** `/user/profile`

#### 请求示例

```bash
curl -X GET http://localhost:3001/api/v1/user/profile \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "userId": "usr_123456",
    "email": "user@example.com",
    "name": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "13800138000",
    "memberLevel": "pro",
    "memberExpireAt": "2025-01-01T00:00:00.000Z",
    "points": 500,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. 更新用户信息

**PUT** `/user/profile`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| name | string | ❌ | 用户昵称 |
| avatar | string | ❌ | 头像 URL |
| phone | string | ❌ | 手机号 |

#### 请求示例

```bash
curl -X PUT http://localhost:3001/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "李四",
    "phone": "13800138001"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "userId": "usr_123456",
    "name": "李四",
    "phone": "13800138001",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## AI选品接口

### 6. 关键词选品分析

**POST** `/ai/product/select`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| keyword | string | ✅ | 商品关键词 |
| platform | string | ✅ | 平台 (shopee/lazada/tiktok) |
| category | string | ❌ | 商品类目 |
| limit | number | ❌ | 返回数量 (默认10) |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/ai/product/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "keyword": "蓝牙耳机",
    "platform": "shopee",
    "category": "电子产品",
    "limit": 10
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "分析完成",
  "data": {
    "taskId": "task_789012",
    "keyword": "蓝牙耳机",
    "platform": "shopee",
    "results": [
      {
        "rank": 1,
        "productName": "无线蓝牙耳机 降噪耳机",
        "imageUrl": "https://example.com/product.jpg",
        "price": 29.99,
        "currency": "USD",
        "salesVolume": 15000,
        "rating": 4.8,
        "reviewCount": 3200,
        "competitiveness": 85,
        "recommendation": "高潜力",
        "reasons": [
          "月销量超过15000件",
          "评分高于4.8",
          "竞争度适中"
        ]
      }
    ],
    "summary": {
      "totalProducts": 100,
      "avgPrice": 35.50,
      "avgSalesVolume": 8000,
      "hotCategories": ["电子产品", "配件"]
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 7. 获取分析结果

**GET** `/ai/product/result/:taskId`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| taskId | string | ✅ | 任务ID |

#### 请求示例

```bash
curl -X GET http://localhost:3001/api/v1/ai/product/result/task_789012 \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "taskId": "task_789012",
    "status": "completed",
    "progress": 100,
    "results": [...]
  }
}
```

---

### 8. 获取选品历史

**GET** `/ai/product/history`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | number | ❌ | 页码 (默认1) |
| pageSize | number | ❌ | 每页数量 (默认10) |

#### 请求示例

```bash
curl -X GET "http://localhost:3001/api/v1/ai/product/history?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "taskId": "task_789012",
        "keyword": "蓝牙耳机",
        "platform": "shopee",
        "resultCount": 10,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 翻译接口

### 9. 文本翻译

**POST** `/ai/translate`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| text | string | ✅ | 待翻译文本 |
| sourceLang | string | ✅ | 源语言 (auto/中文/英文等) |
| targetLang | string | ✅ | 目标语言 |
| style | string | ❌ | 翻译风格 (formal/casual/marketing) |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "text": "高品质蓝牙耳机，支持降噪功能",
    "sourceLang": "zh",
    "targetLang": "en",
    "style": "marketing"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "翻译成功",
  "data": {
    "originalText": "高品质蓝牙耳机，支持降噪功能",
    "translatedText": "High-Quality Bluetooth Headphones with Active Noise Cancellation",
    "sourceLang": "zh",
    "targetLang": "en",
    "style": "marketing",
    "usagePoints": 10
  }
}
```

---

### 10. 批量翻译

**POST** `/ai/translate/batch`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| texts | string[] | ✅ | 待翻译文本数组 (最多20条) |
| sourceLang | string | ✅ | 源语言 |
| targetLang | string | ✅ | 目标语言 |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/ai/translate/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "texts": [
      "高品质蓝牙耳机",
      "支持降噪功能",
      "长续航电池"
    ],
    "sourceLang": "zh",
    "targetLang": "en"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "翻译成功",
  "data": {
    "results": [
      {
        "originalText": "高品质蓝牙耳机",
        "translatedText": "High-Quality Bluetooth Headphones"
      },
      {
        "originalText": "支持降噪功能",
        "translatedText": "Active Noise Cancellation Support"
      },
      {
        "originalText": "长续航电池",
        "translatedText": "Long Battery Life"
      }
    ],
    "totalUsagePoints": 30
  }
}
```

---

### 11. 获取支持的语言

**GET** `/ai/translate/languages`

#### 请求示例

```bash
curl -X GET http://localhost:3001/api/v1/ai/translate/languages \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sourceLanguages": [
      { "code": "auto", "name": "自动检测" },
      { "code": "zh", "name": "中文" },
      { "code": "en", "name": "英语" }
    ],
    "targetLanguages": [
      { "code": "en", "name": "英语" },
      { "code": "th", "name": "泰语" },
      { "code": "vi", "name": "越南语" },
      { "code": "id", "name": "印尼语" },
      { "code": "ms", "name": "马来语" }
    ]
  }
}
```

---

## 定价接口

### 12. 智能定价分析

**POST** `/ai/pricing/analyze`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| productName | string | ✅ | 商品名称 |
| costPrice | number | ✅ | 成本价 |
| platform | string | ✅ | 目标平台 |
| competitorPrices | number[] | ❌ | 竞品价格数组 |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/ai/pricing/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productName": "无线蓝牙耳机",
    "costPrice": 15.00,
    "platform": "shopee",
    "competitorPrices": [25.99, 29.99, 35.99]
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "分析完成",
  "data": {
    "productName": "无线蓝牙耳机",
    "costPrice": 15.00,
    "currency": "USD",
    "recommendation": {
      "suggestedPrice": 28.99,
      "profitMargin": 48.3,
      "strategy": "competitive",
      "reason": "建议采用竞争性定价，低于市场均价10%左右"
    },
    "analysis": {
      "marketAvgPrice": 30.66,
      "yourProfitAtSuggested": 13.99,
      "breakEvenPrice": 18.00,
      "recommendedShippingFee": 3.00
    },
    "platformFees": {
      "commission": 2.90,
      "transactionFee": 0.29,
      "paymentFee": 0.87
    }
  }
}
```

---

### 13. 获取定价建议

**GET** `/ai/pricing/suggestions`

#### 请求示例

```bash
curl -X GET http://localhost:3001/api/v1/ai/pricing/suggestions \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "strategies": [
      {
        "type": "competitive",
        "description": "竞争性定价",
        "margin": "30-40%",
        "suitable": "市场早期进入"
      },
      {
        "type": "premium",
        "description": "溢价定价",
        "margin": "60%+",
        "suitable": "差异化产品"
      },
      {
        "type": "penetration",
        "description": "渗透定价",
        "margin": "20-30%",
        "suitable": "快速获取市场份额"
      }
    ]
  }
}
```

---

## 积分接口

### 14. 获取积分余额

**GET** `/points/balance`

#### 请求示例

```bash
curl -X GET http://localhost:3001/api/v1/points/balance \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "balance": 500,
    "totalEarned": 1000,
    "totalUsed": 500,
    "frozen": 0
  }
}
```

---

### 15. 获取积分记录

**GET** `/points/history`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | number | ❌ | 页码 |
| pageSize | number | ❌ | 每页数量 |
| type | string | ❌ | 类型 (earn/spend) |

#### 请求示例

```bash
curl -X GET "http://localhost:3001/api/v1/points/history?page=1&pageSize=10&type=spend" \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "pt_123456",
        "type": "spend",
        "amount": 50,
        "description": "AI选品分析",
        "balance": 500,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "pt_123455",
        "type": "earn",
        "amount": 100,
        "description": "每日签到奖励",
        "balance": 550,
        "createdAt": "2023-12-31T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 16. 每日签到

**POST** `/points/checkin`

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/points/checkin \
  -H "Authorization: Bearer <token>"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "签到成功",
  "data": {
    "points": 10,
    "consecutiveDays": 3,
    "totalPoints": 510,
    "bonus": {
      "available": true,
      "amount": 20,
      "condition": "连续签到7天"
    }
  }
}
```

---

## 验证码接口

### 17. 获取验证码

**POST** `/captcha/generate`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| type | string | ✅ | 类型 (register/login/reset) |

#### 请求示例

```bash
curl -X POST http://localhost:3001/api/v1/captcha/generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "type": "register"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "验证码已发送",
  "data": {
    "captchaId": "cap_123456",
    "expiresIn": 300
  }
}
```

---

## 健康检查

### 18. 健康检查

**GET** `/health`

> 此接口无需认证

#### 请求示例

```bash
curl http://localhost:3001/api/v1/health
```

#### 响应示例

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## 错误码说明

| 错误码 | 描述 | 说明 |
|--------|------|------|
| 0 | success | 请求成功 |
| 1000 | invalid_request | 无效的请求参数 |
| 1001 | unauthorized | 未授权或Token过期 |
| 1002 | forbidden | 无权限访问 |
| 1003 | not_found | 资源不存在 |
| 1004 | conflict | 资源冲突 |
| 1005 | validation_error | 数据验证失败 |
| 2001 | email_exists | 邮箱已被注册 |
| 2002 | invalid_credentials | 用户名或密码错误 |
| 2003 | email_not_verified | 邮箱未验证 |
| 3001 | insufficient_points | 积分不足 |
| 3002 | captcha_expired | 验证码已过期 |
| 3003 | captcha_invalid | 验证码错误 |
| 4001 | ai_service_error | AI服务错误 |
| 4002 | ai_quota_exceeded | AI调用额度超限 |
| 5001 | internal_error | 服务器内部错误 |

---

## 下一步

- [用户手册](./用户手册.md) - 功能使用教程
- [故障排查](./故障排查.md) - 常见问题解决
