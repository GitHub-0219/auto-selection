#!/bin/bash
# Auto-Selection 项目一键部署脚本
# 适用于 Ubuntu 20.04+ / CentOS 7+

set -e

# ==================== 配置区域 ====================
GITHUB_REPO="https://github.com/GitHub-0219/auto-selection.git"
PROJECT_DIR="/opt/auto-selection"
SERVER_IP="139.226.175.192"
SERVER_USER="zzp_server"
BACKEND_PORT="3001"
FRONTEND_PORT="5173"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==================== 前置检查 ====================
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v git &> /dev/null; then
        log_info "安装 Git..."
        sudo apt-get update && sudo apt-get install -y git
    fi
    
    if ! command -v node &> /dev/null; then
        log_info "安装 Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    if ! command -v docker &> /dev/null; then
        log_info "安装 Docker..."
        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker $USER
    fi
    
    log_info "依赖检查完成!"
}

# ==================== 项目拉取 ====================
clone_project() {
    log_info "克隆项目到 $PROJECT_DIR..."
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warn "项目目录已存在，是否更新? (y/n)"
        read -r response
        if [ "$response" = "y" ]; then
            cd "$PROJECT_DIR" && git pull origin main
        fi
    else
        sudo mkdir -p "$(dirname $PROJECT_DIR)"
        sudo git clone "$GITHUB_REPO" "$PROJECT_DIR"
        sudo chown -R $USER:$USER "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    log_info "项目克隆完成!"
}

# ==================== 环境配置 ====================
setup_environment() {
    log_info "配置环境变量..."
    
    cat > "$PROJECT_DIR/.env" << 'EOF'
# Backend Configuration
PORT=3001
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/auto_selection
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API Keys (请替换为真实密钥)
TIKTOK_API_KEY=your-tiktok-api-key
TIKTOK_API_SECRET=your-tiktok-api-secret
EOF

    log_info "环境变量配置完成!"
}

# ==================== 后端部署 ====================
deploy_backend() {
    log_info "部署后端服务..."
    
    cd "$PROJECT_DIR/backend"
    
    # 安装依赖
    npm install --production
    
    # 构建
    npm run build
    
    # 使用 PM2 启动服务
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    pm2 stop auto-selection-backend 2>/dev/null || true
    pm2 start npm --name "auto-selection-backend" -- start
    
    log_info "后端部署完成! 访问 http://$SERVER_IP:$BACKEND_PORT"
}

# ==================== 前端部署 ====================
deploy_frontend() {
    log_info "部署前端服务..."
    
    cd "$PROJECT_DIR/frontend"
    
    # 安装依赖
    npm install
    
    # 构建
    npm run build
    
    # 使用 Nginx 部署
    if ! command -v nginx &> /dev/null; then
        sudo apt-get install -y nginx
    fi
    
    sudo tee /etc/nginx/sites-available/auto-selection > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        root /opt/auto-selection/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

    sudo ln -sf /etc/nginx/sites-available/auto-selection /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    log_info "前端部署完成! 访问 http://$SERVER_IP"
}

# ==================== 数据库部署 ====================
deploy_database() {
    log_info "部署数据库..."
    
    # 使用 Docker 启动 MongoDB
    if ! docker ps | grep -q mongo; then
        docker run -d \
            --name mongo \
            -p 27017:27017 \
            -v mongo_data:/data/db \
            mongo:6
            
        log_info "MongoDB 启动完成"
    fi
    
    # 使用 Docker 启动 Redis
    if ! docker ps | grep -q redis; then
        docker run -d \
            --name redis \
            -p 6379:6379 \
            redis:7-alpine
            
        log_info "Redis 启动完成"
    fi
    
    log_info "数据库部署完成!"
}

# ==================== 启动所有服务 ====================
start_services() {
    log_info "启动所有服务..."
    
    cd "$PROJECT_DIR"
    
    # 启动后端
    pm2 restart auto-selection-backend
    
    # 重载 Nginx
    sudo systemctl reload nginx
    
    log_info "所有服务启动完成!"
    log_info "==================================="
    log_info "前端地址: http://$SERVER_IP"
    log_info "后端API: http://$SERVER_IP:$BACKEND_PORT/api"
    log_info "PM2状态: pm2 status"
    log_info "==================================="
}

# ==================== 主流程 ====================
main() {
    echo "==================================="
    echo "  Auto-Selection 一键部署脚本"
    echo "==================================="
    
    check_dependencies
    deploy_database
    clone_project
    setup_environment
    deploy_backend
    deploy_frontend
    start_services
    
    log_info "部署完成!"
}

# 执行主流程
main "$@"
