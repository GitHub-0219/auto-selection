# 部署指南

本文档详细说明了项目的构建和部署流程。

## 📋 目录

- [环境要求](#环境要求)
- [本地构建](#本地构建)
- [部署方式](#部署方式)
  - [静态托管部署](#静态托管部署)
  - [Docker 部署](#docker-部署)
  - [云服务器部署](#云服务器部署)
- [环境变量配置](#环境变量配置)
- [CI/CD 自动部署](#cicd-自动部署)
- [常见问题排查](#常见问题排查)

## 环境要求

### 运行环境

| 依赖 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Docker | 24.0.0 | 25.x（可选） |

### 硬件要求

- **CPU**: 1 核+
- **内存**: 512MB+（推荐 1GB）
- **磁盘**: 1GB+ 可用空间

## 本地构建

```bash
# 1. 安装依赖
npm ci --production

# 2. 构建项目
npm run build

# 3. 预览构建产物
npm run preview
```

构建产物默认输出到 `dist/` 目录。

## 部署方式

### 静态托管部署

#### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

或直接连接 GitHub 仓库，在 Vercel 控制台配置：
- **Framework Preset**: 自动检测
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod
```

**Netlify 配置** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### GitHub Pages

在 GitHub 仓库设置中：
1. 进入 **Settings** > **Pages**
2. **Source**: 选择 `GitHub Actions`
3. 添加 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

### Docker 部署

#### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

#### 构建和运行

```bash
# 构建镜像
docker build -t <project-name> .

# 运行容器
docker run -d -p 8080:80 --name <project-name> <project-name>
```

#### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

```bash
docker-compose up -d
```

### 云服务器部署

#### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/<project-name>/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

#### 部署脚本

```bash
#!/bin/bash
set -e

echo "🚀 开始部署..."

# 拉取最新代码
git pull origin main

# 安装依赖并构建
npm ci
npm run build

# 复制构建产物
sudo cp -r dist/* /var/www/<project-name>/dist/

# 重载 Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ 部署完成！"
```

## 环境变量配置

### 环境变量文件

创建 `.env.production` 文件：

```bash
# 应用配置
VITE_APP_TITLE=My App
VITE_APP_VERSION=1.0.0

# API 配置
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT=10000

# 第三方服务
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 环境变量命名规则

- 前端项目使用 `VITE_` 前缀（Vite 项目）
- 敏感变量不要提交到 Git（已加入 `.gitignore`）
- 提供 `.env.example` 作为模板

## CI/CD 自动部署

### GitHub Actions 完整示例

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      # 部署步骤根据平台配置
```

## 常见问题排查

### 构建失败

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `ENOMEM` | 内存不足 | 增加内存或使用 `NODE_OPTIONS=--max_old_space_size=4096` |
| `Module not found` | 依赖缺失 | 删除 `node_modules` 和 lock 文件后重新安装 |
| `Type error` | 类型错误 | 检查 TypeScript 配置和类型定义 |

### 部署后白屏

1. 检查 `base` 配置是否正确（Vite: `vite.config.ts` 中的 `base`）
2. 检查路由配置是否支持 History 模式
3. 检查浏览器控制台错误信息

### API 请求失败

1. 检查环境变量 `VITE_API_BASE_URL` 是否正确
2. 检查 CORS 配置
3. 检查 HTTPS/HTTP 协议是否匹配
4. 检查网络代理配置

### 性能优化建议

- 启用 Gzip/Brotli 压缩
- 配置合理的缓存策略
- 使用 CDN 加速静态资源
- 开启 HTTP/2
- 图片使用 WebP 格式

---

如有部署相关问题，请提交 [Issue](../../issues) 并附上错误日志。
