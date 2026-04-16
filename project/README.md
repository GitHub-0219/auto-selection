# Auto选品 - 本地演示Demo

> 智能选品、自动翻译、多平台运营的一站式跨境电商解决方案

## 📋 项目简介

Auto选品是一款专为跨境电商打造的一站式解决方案，通过AI技术帮助用户快速开展跨境电商业务。

**当前版本**: 演示Demo v1.0.0  
**状态**: ✅ 功能完整可演示

---

## ✨ 功能清单

### 核心功能
| 功能 | 描述 | 演示状态 |
|------|------|----------|
| 🤖 AI智能选品 | 基于市场数据分析，推荐高潜力商品 | ✅ 可用 |
| 🌍 多语言翻译 | 支持50+语言的自动翻译 | ✅ 可用 |
| 💰 智能定价 | AI驱动的动态定价策略 | ✅ 可用 |
| 📦 订单管理 | 自动化的订单处理流程 | 🔜 开发中 |
| 📊 数据分析 | 实时销售监控和报告 | 🔜 开发中 |

### 页面功能
| 页面 | 功能 | 演示状态 |
|------|------|----------|
| 首页 | 产品介绍、功能展示 | ✅ 可用 |
| 用户注册 | 邮箱注册、表单验证 | ✅ 可用 |
| 用户登录 | 邮箱登录、演示模式 | ✅ 可用 |
| 用户中心 | 个人信息、会员状态 | ✅ 可用 |
| AI选品 | 关键词分析、结果展示 | ✅ 可用 |
| 定价页面 | 套餐展示、升级引导 | ✅ 可用 |

---

## 🚀 快速开始

### 前置要求
- **Node.js**: v18.0.0 或更高版本
- **npm**: v8.0.0 或更高版本

### 方式一：一键启动（推荐）

```bash
# 进入项目目录
cd 项目

# Linux/Mac 执行
./start-demo.sh

# Windows 执行
start-demo.bat
```

脚本会自动检查环境并安装依赖。

### 方式二：手动启动

#### 1. 启动后端 Mock API 服务器

```bash
cd 项目/backend
npm install          # 首次运行需要
npm run mock         # 启动服务
```

服务地址: http://localhost:3001

#### 2. 启动前端开发服务器

```bash
cd 项目/frontend
npm install          # 首次运行需要
npm run dev          # 启动服务
```

访问地址: http://localhost:3000

---

## 📖 演示说明

### 演示账号
- **任意邮箱** + 密码 **demo123**
- 示例: `demo@example.com` / `demo123`

### 演示流程

#### 流程1：用户注册/登录
1. 访问 http://localhost:3000
2. 点击右上角「免费试用」或「登录」
3. 使用演示账号登录或注册新账号

#### 流程2：AI智能选品
1. 登录后进入「用户中心」
2. 点击「AI智能选品」
3. 输入商品关键词（如：蓝牙耳机、智能手表）
4. 点击「开始分析」
5. 查看AI推荐的商品和市场洞察

#### 流程3：定价方案查看
1. 点击顶部「定价」
2. 查看不同套餐的功能对比
3. 点击「免费试用」或「升级」

---

## 🛠️ 技术架构

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **HTTP**: Axios
- **端口**: 3000

### 后端（Mock模式）
- **类型**: Node.js 原生HTTP服务
- **数据**: 内存存储（无需数据库）
- **端口**: 3001

### API端点

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/health | 健康检查 | ❌ |
| POST | /api/auth/register | 用户注册 | ❌ |
| POST | /api/auth/login | 用户登录 | ❌ |
| GET | /api/auth/profile | 获取用户资料 | ✅ |
| GET | /api/auth/membership | 获取会员信息 | ✅ |
| POST | /api/ai/analyze-products | AI选品分析 | ✅ |
| POST | /api/ai/translate | 商品翻译 | ✅ |
| POST | /api/ai/suggest-price | 智能定价 | ✅ |
| GET | /api/ai/capabilities | AI能力列表 | ❌ |
| GET | /api/ai/market-insights | 市场洞察 | ✅ |
| GET | /api/ai/languages | 支持的语言 | ❌ |
| GET | /api/products | 商品列表 | ✅ |

---

## ⚠️ 安全注意事项

> ⚠️ **演示模式仅供本地演示使用**

1. **数据安全**: 所有数据存储在内存中，服务器重启后数据会丢失
2. **认证方式**: Demo使用简化的JWT认证，不适用于生产环境
3. **密码处理**: Demo模式未使用真正的密码加密
4. **CORS配置**: Demo允许所有来源的跨域请求

**生产部署注意事项**:
- 使用HTTPS加密传输
- 实现真正的密码加密（bcrypt）
- 使用正式的JWT令牌
- 配置严格的CORS策略
- 使用数据库持久化存储

---

## 📁 项目结构

```
项目/
├── README.md              # 本文件
├── start-demo.sh          # Linux/Mac启动脚本
├── start-demo.bat         # Windows启动脚本
│
├── frontend/              # Next.js前端应用
│   ├── app/               # 页面组件
│   │   ├── page.tsx       # 首页
│   │   ├── login/         # 登录页
│   │   ├── register/      # 注册页
│   │   ├── dashboard/    # 用户中心
│   │   ├── ai-select/     # AI选品
│   │   └── pricing/       # 定价页
│   ├── components/        # 公共组件
│   ├── lib/               # 工具函数
│   │   ├── api.ts        # API客户端
│   │   └── types.ts      # 类型定义
│   └── package.json
│
└── backend/               # 后端服务
    ├── mock-server.js     # Mock API服务器
    ├── src/               # NestJS源码（完整模式）
    ├── prisma/            # 数据库Schema
    └── package.json
```

---

## 🔧 故障排除

### 前端无法连接后端
1. 确认后端服务运行在端口3001
2. 检查浏览器控制台是否有CORS错误
3. 确认 `NEXT_PUBLIC_API_URL` 环境变量正确

### 登录失败
1. 使用演示账号: `demo@example.com` / `demo123`
2. 清除浏览器localStorage后重试
3. 确认后端服务正常运行

### 端口被占用
- 前端默认端口: 3000
- 后端默认端口: 3001

如果端口被占用，可以修改:
- `frontend/package.json` 中的 `dev` 脚本: `next dev -p 3002`
- `backend/mock-server.js` 中的 `PORT` 常量

---

## 📞 支持

如有问题，请联系开发团队。

---

**版本**: v1.0.0 | **更新时间**: 2024年
