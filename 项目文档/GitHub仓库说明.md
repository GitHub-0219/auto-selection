# GitHub 仓库说明

本指南将帮助您创建和配置 AI跨境新手加速器项目的 GitHub 仓库。

## 目录

1. [创建仓库](#1-创建仓库)
2. [本地初始化](#2-本地初始化)
3. [推送到 GitHub](#3-推送到-github)
4. [配置 GitHub Secrets](#4-配置-github-secrets)
5. [仓库结构说明](#5-仓库结构说明)
6. [GitHub Actions 说明](#6-github-actions-说明)
7. [后续维护](#7-后续维护)

---

## 1. 创建仓库

### 方式一：通过 GitHub 网页创建

1. 登录 GitHub 账号
2. 点击右上角 **"+"** 按钮，选择 **"New repository"**
3. 填写仓库信息：
   - **Owner**: 您的用户名
   - **Repository name**: `ai-cross-border` 或其他名称
   - **Description**: `AI跨境新手加速器 - 智能选品、自动翻译、多平台运营的一站式跨境电商解决方案`
   - **Visibility**: 选择 Public 或 Private
   - **Initialize**: ✓ Add a README file ✗（我们已有 README）
   - **Add .gitignore**: None ✗（我们已有 .gitignore）
   - **License**: MIT License ✓

4. 点击 **"Create repository"**

### 方式二：通过 GitHub CLI 创建

```bash
# 安装 GitHub CLI (如果尚未安装)
# macOS: brew install gh
# Linux: sudo apt install gh

# 登录 GitHub
gh auth login

# 创建仓库
gh repo create ai-cross-border \
  --public \
  --description "AI跨境新手加速器 - 智能选品、自动翻译、多平台运营的一站式跨境电商解决方案" \
  --license MIT \
  --source . \
  --remote origin \
  --push
```

---

## 2. 本地初始化

如果您已克隆项目但尚未初始化 Git：

```bash
cd ai-cross-border

# 初始化 Git 仓库
git init

# 添加所有文件（排除 .gitignore 中的文件）
git add .

# 提交
git commit -m "Initial commit: AI跨境新手加速器项目"

# 重命名主分支为 main
git branch -M main
```

---

## 3. 推送到 GitHub

### 首次推送

```bash
# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/ai-cross-border.git

# 推送到 GitHub
git push -u origin main
```

### 完整命令序列

```bash
# 1. 初始化（如果是全新项目）
git init

# 2. 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/ai-cross-border.git

# 3. 检查状态
git status

# 4. 添加所有文件
git add .

# 5. 提交
git commit -m "feat: 初始提交 AI跨境新手加速器项目

- 添加前端 Next.js 项目
- 添加后端 NestJS 项目
- 配置 GitHub Actions CI/CD
- 添加 MIT 开源协议
- 添加贡献指南"

# 6. 推送
git push -u origin main
```

---

## 4. 配置 GitHub Secrets

为了让 CI/CD 工作流正常运行，需要在 GitHub 仓库中配置密钥。

### 访问 Secrets 设置

1. 进入 GitHub 仓库
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

### 必需 Secrets

| Secret 名称 | 描述 | 示例值 |
|-------------|------|--------|
| `DOCKER_USERNAME` | Docker Hub 用户名 | `yourusername` |
| `DOCKER_TOKEN` | Docker Hub Access Token | `dckr_pat_xxxxx` |
| `STAGING_HOST` | Staging 服务器地址 | `staging.example.com` |
| `STAGING_USER` | Staging 服务器用户名 | `deploy` |
| `STAGING_SSH_KEY` | Staging 服务器 SSH 私钥 | `-----BEGIN RSA...` |
| `PRODUCTION_HOST` | Production 服务器地址 | `api.example.com` |
| `PRODUCTION_USER` | Production 服务器用户名 | `deploy` |
| `PRODUCTION_SSH_KEY` | Production 服务器 SSH 私钥 | `-----BEGIN RSA...` |
| `FRONTEND_API_URL` | 前端 API 地址 | `https://api.example.com` |

### 创建 Docker Access Token

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 点击右上角头像 → **Account Settings**
3. 选择 **Security** → **Access Tokens**
4. 点击 **Generate New Token**
5. 输入描述，选择权限，点击 **Generate**
6. 复制生成的 Token 并添加到 GitHub Secrets

---

## 5. 仓库结构说明

```
ai-cross-border/
├── .github/
│   ├── workflows/           # GitHub Actions 工作流
│   │   ├── ci-cd.yml       # 主 CI/CD 流程
│   │   ├── dependency-review.yml  # 依赖审查
│   │   └── labeler.yml     # PR 自动标签
│   └── labeler.yml         # 标签配置
│
├── frontend/                # 前端应用 (Next.js)
│   ├── app/                # App Router 页面
│   ├── lib/                # 工具函数
│   ├── .env.example        # 环境变量示例
│   ├── .eslintrc.js        # ESLint 配置
│   └── package.json
│
├── backend/                 # 后端应用 (NestJS)
│   ├── src/
│   │   ├── modules/        # 功能模块
│   │   ├── common/         # 公共模块
│   │   └── main.ts         # 入口文件
│   ├── prisma/             # 数据库 Schema
│   ├── mock-server.js      # Mock API
│   ├── .env.example        # 环境变量示例
│   ├── package.json
│   └── nest-cli.json
│
├── .gitignore              # Git 忽略文件
├── LICENSE                 # MIT 开源协议
├── README.md               # 项目说明
├── CONTRIBUTING.md         # 贡献指南
└── docker-compose.yml      # Docker 编排
```

---

## 6. GitHub Actions 说明

### 工作流触发条件

| 工作流 | 触发条件 | 说明 |
|--------|----------|------|
| CI/CD Pipeline | Push/PR 到 main, develop | 自动测试、构建、部署 |
| Dependency Review | PR 创建/更新 | 依赖许可证检查 |
| Auto Labeler | PR 创建/同步 | 自动标签 PR |

### CI/CD 流程

```
┌─────────────────────────────────────────────────────────┐
│                      Push / PR                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  代码质量检查                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Backend Test│  │Frontend Test│  │Code Quality │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                       构建                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │Backend Build│  │Frontend Build│ │Docker Build │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         [develop]      [main]       [Release Tag]
              │             │             │
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────────┐
        │ Staging │   │  跳过   │   │ Production  │
        │ Deploy  │   │ 部署    │   │   Deploy    │
        └─────────┘   └─────────┘   └─────────────┘
```

### 查看 Actions 运行状态

1. 进入 GitHub 仓库
2. 点击 **Actions** 标签页
3. 查看工作流运行历史
4. 点击具体运行查看详细日志

---

## 7. 后续维护

### 分支管理

```bash
# 创建开发分支
git checkout -b develop
git push -u origin develop

# 创建功能分支
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# 创建修复分支
git checkout -b fix/bug-description
git push -u origin fix/bug-description
```

### 同步上游仓库

```bash
# 添加上游仓库
git remote add upstream https://github.com/original-owner/ai-cross-border.git

# 获取上游更新
git fetch upstream

# 合并到本地分支
git checkout main
git merge upstream/main

git checkout develop
git merge upstream/develop
```

### 创建 Release

```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions 将自动部署到 Production
```

### 保护分支

建议在 GitHub 设置中启用分支保护：

1. 进入 **Settings** → **Branches**
2. 点击 **Add branch protection rule**
3. 配置：
   - ✓ Require a pull request before merging
   - ✓ Require status checks to pass before merging
   - ✓ Require branches to be up to date before merging
   - ✓ Include administrators

---

## 快速检查清单

- [ ] GitHub 仓库已创建
- [ ] 本地代码已初始化并提交
- [ ] 已推送到远程仓库
- [ ] GitHub Secrets 已配置（用于 CI/CD）
- [ ] 分支保护规则已启用
- [ ] collaborators/teams 已设置（如需要）

---

## 常见问题

### Q: 如何处理敏感信息？

**A:** 
- 所有敏感信息放在 `.env` 文件中
- `.env` 已在 `.gitignore` 中排除
- 使用 `.env.example` 作为配置模板
- 生产环境密钥存储在 GitHub Secrets

### Q: 如何回滚部署？

**A:**
```bash
# 查看 Docker 容器历史
docker ps -a

# 回滚到之前的版本
docker-compose pull
docker-compose up -d
```

### Q: 如何添加新的环境变量？

**A:**
1. 在 `.env.example` 中添加注释说明
2. 在 GitHub Secrets 中添加对应的 secret
3. 在 CI/CD workflow 中引用 `secrets.XXX`

---

## 联系支持

- **Issues**: https://github.com/YOUR_USERNAME/ai-cross-border/issues
- **Discussion**: https://github.com/YOUR_USERNAME/ai-cross-border/discussions
