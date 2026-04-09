# Auto选品 - 本地Demo演示教程

> 一步一步教你本地运行和演示Auto选品系统

---

## ✅ Demo可行性确认

**本地Demo完全可行！** 项目已包含：
- ✅ 完整的后端Mock服务器（无需数据库）
- ✅ 完整的前端页面代码
- ✅ 一键启动脚本（自动安装依赖）

---

## 🚀 快速启动（推荐）

### Windows用户

1. 双击运行 `start-demo.bat`
2. 等待依赖安装和启动
3. 浏览器访问 http://localhost:3000

### Mac/Linux用户

```bash
# 进入项目目录
cd 项目

# 运行启动脚本
./start-demo.sh

# 浏览器访问 http://localhost:3000
```

---

## 一、环境准备

### 1.1 必需软件

| 软件 | 版本要求 | 下载地址 |
|------|----------|----------|
| Node.js | >= 18.0 | https://nodejs.org |
| npm | >= 9.0 | 随Node.js安装 |
| Git | 最新版 | https://git-scm.com |

### 1.2 验证安装

```bash
# 检查Node.js版本
node -v
# 输出示例：v18.17.0

# 检查npm版本
npm -v
# 输出示例：9.6.7

# 检查Git版本
git --version
# 输出示例：git version 2.40.0
```

---

## 二、下载项目

### 2.1 克隆代码

```bash
# 克隆项目
git clone https://github.com/GitHub-0219/auto-selection.git

# 进入项目目录
cd auto-selection
```

### 2.2 项目结构

```
auto-selection/
├── 项目/
│   ├── backend/        # 后端代码
│   └── frontend/       # 前端代码
├── 项目文档/           # 产品文档
└── 公司管理/           # 公司制度
```

---

## 三、后端启动（必须先启动）

### 3.1 安装依赖

```bash
# 进入后端目录
cd 项目/backend

# 安装依赖
npm install

# 等待安装完成（约2-5分钟）
```

### 3.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件（可选，使用Mock模式无需配置）
```

**.env 文件说明**：
```bash
# 数据库配置（本地开发可使用Mock）
DATABASE_URL="postgresql://user:password@localhost:5432/auto_selection"

# JWT密钥（本地开发可随意填写）
JWT_SECRET="your-secret-key-here"

# AI API配置（Mock模式无需配置）
SILICONFLOW_API_KEY="sk-xxx"
AI_PROVIDER="mock"

# 微信支付（Mock模式无需配置）
WECHAT_MCH_ID=""
WECHAT_MCH_KEY=""
WECHAT_APP_ID=""

# 支付宝（Mock模式无需配置）
ALIPAY_APP_ID=""
ALIPAY_PRIVATE_KEY=""
ALIPAY_PUBLIC_KEY=""
```

### 3.3 启动后端

```bash
# 方式一：Mock模式启动（推荐新手）
npm run mock

# 方式二：开发模式启动（需要数据库）
npm run dev

# 看到以下输出表示成功：
# 🚀 Server running on: http://localhost:3001
# 📊 API Documentation: http://localhost:3001/api
```

### 3.4 验证后端

打开浏览器访问：http://localhost:3001/api

看到API文档页面表示后端启动成功！

---

## 四、前端启动

### 4.1 打开新终端

**重要**：不要关闭后端终端，新开一个终端窗口

### 4.2 安装依赖

```bash
# 进入前端目录
cd 项目/frontend

# 安装依赖
npm install

# 等待安装完成（约2-5分钟）
```

### 4.3 启动前端

```bash
# 启动开发服务器
npm run dev

# 看到以下输出表示成功：
#   ▲ Next.js 14.0.0
#   - Local:        http://localhost:3000
```

### 4.4 访问系统

打开浏览器访问：http://localhost:3000

---

## 五、功能演示

### 5.1 首页

访问 http://localhost:3000

**功能入口**：
- 🔍 AI选品助手
- 📊 爆品排行榜
- 💰 定价方案
- 👤 个人中心

### 5.2 注册/登录

**注册流程**：
1. 点击右上角「注册」
2. 输入邮箱、密码
3. （可选）输入邀请码
4. 完成注册

**演示账号**（Mock模式）：
- 邮箱：任意有效邮箱格式
- 密码：任意（至少6位）

### 5.3 AI选品助手

1. 登录后点击「AI选品」
2. 输入选品关键词（如：手机壳、女装、美妆）
3. 选择目标市场（马来西亚、菲律宾等）
4. 点击「开始分析」
5. 查看选品报告（Mock数据演示）

### 5.4 爆品排行榜

1. 点击「爆品排行榜」
2. 选择国家、类目
3. 查看爆品数据
4. 点击商品查看详情

### 5.5 定价与支付

1. 点击「定价」
2. 选择套餐（周付/月付/年付）
3. 点击「立即购买」
4. 选择支付方式（Mock模式下会模拟支付成功）

---

## 六、常见问题

### 6.1 后端启动失败

**问题**：端口被占用
```bash
# 检查端口占用
lsof -i :3001

# 结束占用进程
kill -9 <PID>
```

**问题**：依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### 6.2 前端启动失败

**问题**：端口被占用
```bash
# 检查端口占用
lsof -i :3000

# 结束占用进程
kill -9 <PID>
```

**问题**：页面空白
```bash
# 清除缓存
rm -rf .next node_modules
npm install
npm run dev
```

### 6.3 API请求失败

**检查**：
1. 后端是否启动（访问 http://localhost:3001/api）
2. 前端是否正确配置API地址
3. 是否登录（需要JWT Token）

### 6.4 Mock模式说明

Mock模式下：
- ✅ 所有功能可用
- ✅ 返回模拟数据
- ✅ 无需配置API密钥
- ❌ 数据不是真实的

---

## 七、生产环境部署

### 7.1 环境变量配置

参考 `项目文档/上线检查清单.md`

### 7.2 部署步骤

参考 `项目文档/上线时间表.md`

### 7.3 监控配置

参考 `项目文档/监控配置指南.md`

---

## 八、技术支持

### 8.1 文档资源

| 文档 | 路径 |
|------|------|
| API文档 | http://localhost:3001/api |
| 产品方案 | 项目文档/PRD_产品需求文档.md |
| 技术架构 | 项目文档/技术架构方案.md |
| 部署方案 | 项目文档/部署方案.md |

### 8.2 联系方式

- **CEO邮箱**：sean.ceo@coze.email
- **GitHub**：https://github.com/GitHub-0219/auto-selection

---

## 九、快速启动命令汇总

```bash
# ===== 后端 =====
cd 项目/backend
npm install
cp .env.example .env
npm run mock

# ===== 前端（新终端）=====
cd 项目/frontend
npm install
npm run dev

# ===== 访问 =====
# 前端：http://localhost:3000
# 后端API：http://localhost:3001/api
```

---

*更新时间：2026年4月9日*
*版本：v1.0*
