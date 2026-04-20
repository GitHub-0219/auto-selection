# Auto选品项目 - 反扒机制

为Auto选品项目提供全面的反爬虫和反自动化防护。

## 功能特性

### 1. 请求频率限制
- **IP级别限流**: 同一IP每分钟最多100次请求
- **用户级别限流**: 同一用户每分钟最多50次请求
- **API级别限流**: 敏感API每分钟最多20次请求

### 2. User-Agent检测
- 自动检测常见爬虫UA
- 拦截空UA或异常UA
- 支持自定义黑名单

### 3. 验证码机制
- 图形验证码
- 滑块验证码
- 可配置触发条件
- 5分钟有效期

### 4. 行为分析
- 鼠标移动轨迹分析
- 点击频率检测
- 键盘输入模式识别
- 蜜罐字段检测

### 5. 数据加密
- AES-256-GCM加密
- API签名验证
- 敏感字段自动脱敏

### 6. IP黑名单
- 手动/自动封禁
- IP段/CIDR封禁
- 白名单管理
- 临时/永久封禁

## 目录结构

```
anti-scraping/
├── backend/
│   ├── middleware/
│   │   ├── antiScraping.js    # 核心反扒中间件
│   │   ├── captcha.js         # 验证码模块
│   │   └── blacklist.js       # IP黑名单管理
│   ├── lib/
│   │   └── encryption.js      # 数据加密工具
│   ├── routes/
│   │   ├── captcha.js         # 验证码API
│   │   └── admin.js           # 管理API
│   └── app.js                 # 应用入口
├── frontend/
│   └── lib/
│       └── behaviorCheck.js   # 前端行为检测
├── tests/
│   └── anti-scraping.test.js  # 综合测试套件
├── docs/
│   ├── 设计文档.md            # 详细设计文档
│   ├── 测试报告.md            # 测试结果报告
│   └── 部署指南.md            # 部署说明
├── package.json
└── .env.example
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置

```bash
cp .env.example .env
# 编辑 .env 配置
```

### 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 运行测试

```bash
npm test
```

## API文档

### 验证码API

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/captcha/image` | GET | 生成图形验证码 |
| `/api/captcha/slider` | GET | 生成滑块验证码 |
| `/api/captcha/verify` | POST | 验证验证码 |
| `/api/captcha/status/:id` | GET | 获取验证码状态 |

### 管理API

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/admin/blacklist` | GET | 获取黑名单 |
| `/api/admin/blacklist/block` | POST | 封禁IP |
| `/api/admin/blacklist/unblock` | POST | 解禁IP |
| `/api/admin/blacklist/block-range` | POST | IP段封禁 |
| `/api/admin/blacklist/block-cidr` | POST | CIDR封禁 |
| `/api/admin/whitelist/add` | POST | 添加白名单 |
| `/api/admin/stats` | GET | 获取统计数据 |

**注意**: 管理API需要 `X-Admin-Api-Key` 请求头

## 配置说明

### 反扒参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `RATE_LIMIT_IP_MAX` | 100 | IP每分钟最大请求数 |
| `RATE_LIMIT_USER_MAX` | 50 | 用户每分钟最大请求数 |
| `RATE_LIMIT_API_MAX` | 20 | 敏感API每分钟最大请求数 |

### 触发验证码条件

- IP请求超过80次/分钟
- 用户请求超过40次/分钟
- 行为分析嫌疑度超过50

## 性能指标

- P95响应时间 < 100ms
- 限流检测开销 < 5ms
- 支持 100+ 并发用户

## 安全测试

✅ SQL注入防护  
✅ XSS防护  
✅ CSRF防护  
✅ 接口越权防护  
✅ 爬虫UA拦截  

## 许可证

MIT License
