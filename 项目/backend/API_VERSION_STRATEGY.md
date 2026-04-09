# Auto选品 API 版本控制策略

> 文档版本：v1.0
> 创建日期：2026-04-09
> 适用范围：Auto选品后端API

---

## 一、版本控制原则

### 1.1 核心原则

1. **URL版本化**：所有API通过URL路径区分版本
2. **向后兼容**：主版本内保持向后兼容
3. **渐进废弃**：旧版本提供迁移窗口期
4. **版本隔离**：不同版本可并行运行

### 1.2 版本格式

```
/api/v{major}/{resource}/{action}
```

| 组件 | 说明 | 示例 |
|------|------|------|
| `api` | API前缀 | 固定 |
| `v{major}` | 主版本号 | v1, v2 |
| `{resource}` | 资源名称 | auth, user, ai |
| `{action}` | 操作动作 | login, register |

---

## 二、当前版本

### 2.1 API v1

**基础URL**：`/api/v1`

**状态**：✅ 当前稳定版本

**发布日期**：2026-04-09

**预计支持至**：2026-12-31

### 2.2 v1 API 端点列表

#### 认证模块 (`/api/v1/auth`)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /register | 用户注册 | 否 |
| POST | /login | 用户登录 | 否 |
| POST | /refresh | 刷新Token | 否 |
| GET | /profile | 获取用户信息 | 是 |
| GET | /membership | 获取会员信息 | 是 |

#### 用户模块 (`/api/v1/users`)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /profile | 获取用户资料 | 是 |
| PUT | /profile | 更新用户资料 | 是 |

#### AI模块 (`/api/v1/ai`)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /analyze-products | 智能选品分析 | 是 |
| POST | /translate | AI翻译 | 是 |
| POST | /suggest-price | 智能定价 | 是 |
| POST | /optimize-description | 优化商品描述 | 是 |
| GET | /capabilities | AI能力列表 | 否 |

#### 订阅模块 (`/api/v1/subscriptions`)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | /plans | 获取订阅方案 | 否 |
| POST | /create | 创建订阅 | 是 |
| GET | /status | 获取订阅状态 | 是 |
| POST | /cancel | 取消订阅 | 是 |

#### 邀请模块 (`/api/v1/invite`)

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | /generate | 生成邀请码 | 是 |
| POST | /use | 使用邀请码 | 是 |
| GET | /records | 获取邀请记录 | 是 |

---

## 三、版本兼容性策略

### 3.1 兼容性规则

| 变更类型 | 向后兼容 | 示例 |
|----------|----------|------|
| **新增端点** | ✅ | 新增 `/v1/products/export` |
| **新增字段** | ✅ | 响应中新增 `newField` |
| **字段重命名** | ❌ | 需废弃旧字段 |
| **删除端点** | ❌ | 需提前公告 |
| **修改参数** | ❌ | 需新版本 |

### 3.2 废弃流程

```
发现弃用
    ↓
在文档中标记 [DEPRECATED]
    ↓
响应头添加警告: X-API-Warning
    ↓
保留至少3个月
    ↓
正式移除
```

---

## 四、错误码规范

### 4.1 错误码格式

```
{模块}_{错误类型}
```

### 4.2 认证模块错误码

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 凭证无效 |
| AUTH_TOKEN_EXPIRED | 401 | Token过期 |
| AUTH_TOKEN_INVALID | 401 | Token无效 |
| AUTH_ACCOUNT_LOCKED | 429 | 账户被锁定 |
| AUTH_RATE_LIMITED | 429 | 请求过于频繁 |

### 4.3 邀请模块错误码

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| INVITE_CODE_NOT_FOUND | 404 | 邀请码不存在 |
| INVITE_SELF_USE | 400 | 不能邀请自己 |
| INVITE_ALREADY_USED | 400 | 邀请码已被使用 |
| INVITE_EXPIRED | 400 | 邀请码已过期 |
| INVITE_ALREADY_CLAIMED | 400 | 已使用过邀请码 |
| INVITE_CODE_INVALID | 400 | 邀请码格式不正确 |

### 4.4 支付模块错误码

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| PAYMENT_ALREADY_PROCESSED | 400 | 订单已支付 |
| PAYMENT_AMOUNT_MISMATCH | 400 | 金额不匹配 |
| PAYMENT_SIGNATURE_INVALID | 400 | 签名验证失败 |
| PAYMENT_TIMEOUT | 408 | 支付超时 |

---

## 五、变更日志

### v1.1 (2026-04-09)

**新增**：
- `POST /api/v1/auth/refresh` - Token刷新接口
- 邀请码格式校验（6-12位字母数字）
- 邀请模块细粒度错误码

**修复**：
- 登录限流机制完善
- 重复支付幂等性检查
- 响应头安全优化

### v1.0 (2026-04-09)

**初始版本**：
- 用户注册/登录
- AI选品分析
- 订阅管理
- 邀请奖励

---

## 六、迁移指南

### 6.1 从 v1.0 迁移到 v1.1

**Token刷新**：
```javascript
// 旧版：仅获取 accessToken
const { accessToken } = await login()

// 新版：同时获取 accessToken 和 refreshToken
const { accessToken, refreshToken } = await login()

// 使用 refreshToken 获取新的 accessToken
const { accessToken: newAccessToken } = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
})
```

### 6.2 错误处理更新

```javascript
// 新版建议：解析业务错误码
const result = await api.post('/api/v1/invite/use', { code: 'ABC123' })
if (!result.success) {
  const errorCode = result.message.split(':')[0] // INVITE_ALREADY_USED
  switch (errorCode) {
    case 'INVITE_SELF_USE':
      // 不能邀请自己
      break
    case 'INVITE_ALREADY_USED':
      // 邀请码已被使用
      break
    case 'INVITE_EXPIRED':
      // 邀请码已过期
      break
  }
}
```

---

## 七、版本路线图

| 时间 | 版本 | 计划功能 |
|------|------|----------|
| 2026-Q1 | v1.2 | WebSocket实时推送 |
| 2026-Q2 | v2.0 | GraphQL支持 |
| 2026-Q3 | v2.1 | 多语言国际化 |

---

*文档更新时间：2026-04-09*
