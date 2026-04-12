# Auto选品 - GitHub推送指南

## 📋 仓库信息

| 项目 | 值 |
|------|-----|
| **本地项目路径** | `./项目` |
| **GitHub用户名** | GitHub-0219 |
| **仓库名** | auto-selection |
| **仓库完整地址** | `https://github.com/GitHub-0219/auto-selection.git` |

---

## 🚀 GitHub仓库创建步骤

### 方式一：网页端创建（推荐新手）

1. 登录 GitHub：https://github.com
2. 点击右上角 **"+"** → **"New repository"**
3. 填写信息：
   - **Repository name**: `auto-selection`
   - **Description**: `Auto选品 - 智能跨境电商选品解决方案`
   - **选择 Public**（公开）或 Private（私有）
   - ⚠️ **不要勾选** "Initialize this repository with a README"
4. 点击 **"Create repository"**
5. 页面会显示仓库地址，复制备用

### 方式二：GitHub CLI 创建

```bash
# 安装 gh (如未安装)
# Windows: winget install GitHub.cli
# Mac: brew install gh

# 登录
gh auth login

# 创建仓库
gh repo create auto-selection --public --clone

# 或私有仓库
gh repo create auto-selection --private --clone
```

---

## 🔧 Git 初始化与推送命令

### 完整命令序列

```bash
# 1. 进入项目目录
cd ./项目

# 2. 初始化 Git 仓库（如尚未初始化）
git init

# 3. 配置用户信息（全局）
git config --global user.name "GitHub-0219"
git config --global user.email "your-email@example.com"

# 4. 添加远程仓库
git remote add origin https://github.com/GitHub-0219/auto-selection.git

# 5. 添加所有文件到暂存区
git add .

# 6. 提交到本地仓库
git commit -m "feat: 初始化Auto选品项目

- 前后端项目结构
- AI智能选品功能
- 用户认证系统
- Docker部署配置"

# 7. 重命名主分支为 main（可选）
git branch -M main

# 8. 推送到远程仓库
git push -u origin main

# 9. 验证推送成功
git remote -v
```

---

## 📁 项目结构

```
项目/
├── .gitignore          ✅ 已存在
├── LICENSE             ✅ 已存在
├── CONTRIBUTING.md     ✅ 已存在
├── README.md           ✅ 已存在
├── package.json        ✅ 根目录配置文件
├── docker-compose.yml  ✅ Docker编排文件
├── start-demo.sh       ✅ Linux/Mac启动脚本
├── start-demo.bat      ✅ Windows启动脚本
├── frontend/           ✅ 前端项目 (Next.js)
│   ├── package.json    ✅ 已更新项目名称
│   └── ...
└── backend/            ✅ 后端项目 (NestJS)
    ├── package.json    ✅ 已更新项目名称
    └── ...
```

---

## ⚠️ 注意事项

### 1. 敏感信息处理
- 项目中的 `.gitignore` 已配置忽略敏感文件
- **不要提交** `.env`、`.env.local`、`.env.production` 等包含密钥的文件
- 如需分享环境变量，创建 `.env.example` 模板

### 2. 首次推送认证
```bash
# HTTPS 方式（每次需要输入用户名密码或Token）
git remote add origin https://github.com/GitHub-0219/auto-selection.git

# SSH 方式（推荐，一劳永逸）
# 1. 生成SSH密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 3. 复制公钥，添加到 GitHub → Settings → SSH Keys

# 4. 使用SSH地址
git remote add origin git@github.com:GitHub-0219/auto-selection.git
```

### 3. 常见问题

**Q: 推送被拒绝？**
```bash
# 可能原因：远程仓库有更新，需要先拉取合并
git pull origin main --rebase

# 如果有冲突，解决后继续
git rebase --continue
```

**Q: 想要更新已提交的代码？**
```bash
# 编辑文件后
git add .
git commit -m "your commit message"
git push origin main
```

**Q: 如何查看提交历史？**
```bash
git log --oneline
```

---

## 🎯 推荐的工作流程

```bash
# 每次开发前
git pull origin main

# 开发完成后
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

---

## 📞 资源链接

- GitHub 官方文档：https://docs.github.com
- Git 教程：https://git-scm.com/doc
- SSH 密钥设置：https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

*生成时间: 2025年*
