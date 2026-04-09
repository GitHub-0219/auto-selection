# Auto选品 - 后端项目概览

## 📁 项目结构

```
backend/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.module.ts              # 根模块
│   ├── app.controller.ts          # 根控制器
│   │
│   ├── common/                    # 公共模块
│   │   ├── decorators/           # 自定义装饰器
│   │   │   ├── param.decorators.ts
│   │   │   └── security.decorators.ts  # @Roles() 权限装饰器
│   │   ├── filters/               # 异常过滤器
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/                # 守卫
│   │   │   ├── jwt-auth.guard.ts         # JWT认证守卫
│   │   │   ├── login-throttler.guard.ts  # 登录限流守卫
│   │   │   └── roles.guard.ts             # RBAC角色守卫
│   │   ├── prisma/                # Prisma服务
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── security/              # 安全模块
│   │   │   ├── audit-log.service.ts      # 审计日志
│   │   │   ├── data-masking.service.ts    # 数据脱敏
│   │   │   ├── encryption.service.ts      # 加密服务
│   │   │   ├── rate-limit.middleware.ts   # 限流中间件
│   │   │   └── security-headers.middleware.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts     # JWT策略
│   │
│   └── modules/                   # 业务模块
│       ├── ai/                    # AI服务模块
│       │   ├── ai.controller.ts
│       │   ├── ai.module.ts
│       │   ├── ai.service.ts
│       │   └── silicon-flow.service.ts    # 硅基流动API
│       │
│       ├── user/                  # 用户模块
│       │   ├── user.controller.ts
│       │   ├── user.module.ts
│       │   └── user.service.ts
│       │
│       ├── product/               # 商品模块
│       ├── order/                 # 订单模块
│       ├── captcha/               # 验证码模块
│       │
│       ├── payment/                # 💰 支付模块
│       │   ├── payment.controller.ts
│       │   ├── payment.module.ts
│       │   ├── subscription.service.ts    # 订阅管理
│       │   ├── wechat-pay.service.ts      # 微信支付
│       │   └── alipay.service.ts           # 支付宝
│       │
│       ├── invite/                 # 🔗 邀请模块
│       │   ├── invite.controller.ts
│       │   ├── invite.module.ts
│       │   └── invite.service.ts
│       │
│       └── points/                # 🎁 积分模块
│           ├── points.controller.ts
│           ├── points.module.ts
│           └── points.service.ts
│
├── prisma/
│   ├── schema.prisma              # 数据库Schema
│   └── seed.ts                   # 数据种子
│
├── docs/
│   ├── API.md                     # API文档
│   └── TEST_REPORT.md             # 测试报告
│
├── scripts/                       # 脚本
├── .env                           # 环境变量
├── .env.example                   # 环境变量模板
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🎯 功能模块

### 1. AI服务 (已完成 ✅)

**服务地址**: `/ai/*`

| 功能 | 端点 | 说明 |
|------|------|------|
| 选品报告 | POST `/ai/selection-report` | AI分析市场趋势、竞争度、利润 |
| 多语言翻译 | POST `/ai/translate` | 15种语言翻译 |
| 批量翻译 | POST `/ai/batch-translate` | 批量翻译商品信息 |
| 视频脚本 | POST `/ai/video-script` | TikTok/YouTube/Ins脚本 |
| AI对话 | POST `/ai/chat` | 跨境电商问题解答 |

**支持的语言**:
🇺🇸 English | 🇨🇳 中文 | 🇯🇵 日本語 | 🇰🇷 한국어 | 🇩🇪 Deutsch
🇫🇷 Français | 🇪🇸 Español | 🇵🇹 Português | 🇮🇹 Italiano | 🇷🇺 Русский
🇸🇦 العربية | 🇮🇳 हिन्दी | 🇹🇭 ไทย | 🇻🇳 Tiếng Việt | 🇮🇩 Bahasa Indonesia

---

### 2. 支付系统 (已完成 ✅)

**服务地址**: `/payment/*`

**订阅方案**:

| 方案 | 月价 | 季付(9折) | 年付(7折) | 功能 |
|------|------|----------|----------|------|
| 基础会员 | ¥9.9 | ¥26.7 | ¥83.2 | 10次选品/天, 50次翻译/天 |
| 专业会员 | ¥29.9 | ¥80.7 | ¥251.2 | 无限选品, 无限翻译, 视频脚本 |
| 企业会员 | ¥99.9 | ¥269.7 | ¥839.2 | 全功能, 多账号, 专属客服 |

**支付渠道**:
- 💚 微信支付 (Native/JSAPI)
- 💙 支付宝 (Web/WAP/APP)

---

### 3. 邀请系统 (已完成 ✅)

**服务地址**: `/invite/*`

- 邀请码生成
- 邀请码使用
- 邀请记录查询
- 邀请返现 (邀请人¥10, 被邀请人¥5)

---

### 4. 积分系统 (已完成 ✅)

**服务地址**: `/points/*`

- 积分余额查询
- 积分明细
- 积分抵现计算
- 积分规则

**规则**:
- 消费返积分: ¥1 = 10积分
- 积分抵现: 100积分 = ¥1
- 积分有效期: 365天

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| NestJS | 后端框架 |
| TypeScript | 开发语言 |
| Prisma | ORM |
| PostgreSQL | 数据库 |
| JWT | 认证 |
| RBAC | 权限控制 |
| Throttler | 限流 |

---

## 📦 依赖

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/config": "^3.1.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/throttler": "^5.1.0",
  "@prisma/client": "^5.8.1",
  "axios": "^1.6.5",
  "bcrypt": "^5.1.1",
  "class-validator": "^0.14.1"
}
```

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑.env设置必要的API密钥

# 3. 初始化数据库
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. 启动开发服务器
npm run start:dev

# 5. 或使用Mock模式 (无需配置API密钥)
AI_PROVIDER=mock npm run start:dev
```

---

## 📝 API文档

详细API文档请查看: [docs/API.md](./docs/API.md)

---

## 📊 数据库Schema

主要表结构:

- **User** - 用户表
- **Membership** - 会员表
- **Subscription** - 订阅记录
- **SubscriptionPlan** - 订阅方案
- **Payment** - 支付记录
- **InviteCode** - 邀请码
- **InviteReward** - 邀请奖励
- **PointTransaction** - 积分记录
- **AIUsage** - AI使用记录
- **AuditLog** - 审计日志

---

## 🔐 安全特性

- [x] JWT认证
- [x] RBAC权限控制
- [x] 登录限流 (防暴力破解)
- [x] API限流
- [x] SQL注入防护
- [x] XSS防护
- [x] 审计日志
- [x] 数据脱敏
- [x] 敏感信息加密

---

## 📋 待开发

- [ ] 配额系统 (AI接口限流)
- [ ] 定时任务 (订阅过期检查)
- [ ] Redis缓存
- [ ] 单元测试
- [ ] 性能监控

---

## 📞 联系方式

如有问题，请联系开发团队。
