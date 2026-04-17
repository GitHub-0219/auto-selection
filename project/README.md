# Auto选品 - 跨境电商AI智能选品平台

> 智能选品、自动翻译、多平台运营的一站式跨境电商解决方案

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)

---

## 📋 项目简介

Auto选品是一款专为跨境电商打造的一站式解决方案，通过AI技术帮助用户快速开展跨境电商业务。支持东南亚 Shopee/Lazada、TikTok Shop 等主流平台。

**当前版本**: v1.0.0  
**技术架构**: Next.js 14 + NestJS 10 + TypeScript

---

## ✨ 核心功能

| 功能模块 | 描述 | 状态 |
|---------|------|------|
| 🤖 AI智能选品 | 基于市场数据分析，推荐高潜力商品 | ✅ 可用 |
| 🌍 多语言翻译 | 支持50+语言的自动翻译 | ✅ 可用 |
| 💰 智能定价 | AI驱动的动态定价策略 | ✅ 可用 |
| 📦 订单管理 | 自动化的订单处理流程 | 🔜 开发中 |
| 📊 数据分析 | 实时销售监控和报告 | 🔜 开发中 |

---

## 🛠 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **UI库**: Tailwind CSS
- **状态管理**: Zustand
- **表单验证**: React Hook Form + Zod
- **HTTP客户端**: Axios

### 后端
- **框架**: NestJS 10
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **认证**: JWT

### 基础设施
- **容器化**: Docker + Docker Compose
- **Web服务器**: Nginx
- **进程管理**: PM2
- **CI/CD**: GitHub Actions

---

## 🚀 快速开始

### 前置要求

- **Node.js**: v18.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **PostgreSQL**: v14+ (仅生产环境)
- **Docker**: v20+ (可选，用于容器化部署)

### 方式一：一键启动 (推荐)

```bash
# 克隆项目
git clone https://github.com/GitHub-0219/auto-selection.git
cd auto-selection/project

# Linux/Mac
chmod +x start-demo.sh
./start-demo.sh

# Windows
start-demo.bat
```

脚本会自动：
1. 检查 Node.js 环境
2. 安装后端依赖
3. 安装前端依赖
4. 启动 Mock API 服务器 (端口 3001)
5. 启动前端开发服务器 (端口 3000)

### 方式二：手动启动

#### 1. 启动后端 Mock API 服务器

```bash
cd project/backend
npm install
npm run mock
```

服务地址: http://localhost:3001

#### 2. 启动前端开发服务器

```bash
cd project/frontend
npm install
npm run dev
```

访问地址: http://localhost:3000

---

## 📁 项目结构

```
project/
├── frontend/                 # Next.js 前端应用
│   ├── app/                  # App Router 页面
│   │   ├── ai-select/        # AI选品页面
│   │   ├── dashboard/        # 用户仪表盘
│   │   ├── login/            # 登录页面
│   │   ├── pricing/          # 定价页面
│   │   ├── profile/          # 个人中心
│   │   └── register/         # 注册页面
│   ├── components/           # React 组件
│   └── lib/                  # 工具函数
│
├── backend/                  # NestJS 后端服务
│   ├── src/
│   │   ├── modules/          # 功能模块
│   │   │   ├── ai/           # AI选品模块
│   │   │   ├── user/         # 用户模块
│   │   │   ├── product/      # 商品模块
│   │   │   ├── order/        # 订单模块
│   │   │   ├── payment/      # 支付模块
│   │   │   └── points/       # 积分模块
│   │   └── common/           # 公共模块
│   ├── prisma/               # 数据库 schema
│   └── docs/                 # API 文档
│
├── docker-compose.yml        # Docker Compose 配置
└── start-demo.sh             # 一键启动脚本
```

---

## 🔑 演示账号

- **任意邮箱** + 密码 **demo123**
- 示例: `demo@example.com` / `demo123`

---

## 📚 文档目录

| 文档 | 描述 |
|------|------|
| [部署指南](./docs/部署指南.md) | 服务器环境配置、一键部署、手动部署 |
| [API文档](./docs/API文档.md) | 所有API接口说明、请求/响应示例 |
| [用户手册](./docs/用户手册.md) | 功能使用教程、操作指南 |
| [故障排查](./docs/故障排查.md) | 常见问题、解决方案、日志查看 |

---

## 🌐 访问地址

### 本地开发
- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api/v1

### 演示服务器
- 前端: http://139.226.175.192
- 后端 API: http://139.226.175.192:3001/api/v1

---

## 🔒 环境变量

### 后端 (.env)

```env
# 应用配置
NODE_ENV=development
PORT=3001

# 数据库 (生产环境)
DATABASE_URL=postgresql://user:password@localhost:5432/auto_selection

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AI服务
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx

# 前端URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### 前端 (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=Auto选品
```

---

## 🐳 Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

---

## 📄 许可证

本项目基于 [MIT 许可证](./LICENSE) 开源。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [NestJS](https://nestjs.com/) - Node.js 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Prisma](https://prisma.io/) - 数据库 ORM
