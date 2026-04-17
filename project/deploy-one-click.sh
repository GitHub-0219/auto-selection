#!/bin/bash

# ============================================
# Auto选品 - 一键部署脚本 (生产环境)
# 支持: Ubuntu/CentOS/Debian/Fedora
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
APP_NAME="auto-selection"
APP_DIR="/opt/${APP_NAME}"
BACKEND_PORT=3001
FRONTEND_PORT=3000
REQUIRED_NODE_VERSION=18
GIT_REPO="${1:-}"

# ============================================
# 日志函数
# ============================================
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# ============================================
# 横幅
# ============================================
show_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║      🚀 Auto选品 - 一键部署脚本 v2.0                       ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ============================================
# 1. 检测系统环境
# ============================================
detect_os() {
    log "📋 检测操作系统..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        error "无法检测操作系统"
    fi
    
    case $OS in
        ubuntu|debian)
            PKG_MANAGER="apt-get"
            log "✓ 检测到 ${PRETTY_NAME:-Ubuntu/Debian} (使用 apt-get)"
            ;;
        centos|rhel)
            PKG_MANAGER="yum"
            log "✓ 检测到 ${PRETTY_NAME:-CentOS/RHEL} (使用 yum)"
            ;;
        fedora)
            PKG_MANAGER="dnf"
            log "✓ 检测到 Fedora (使用 dnf)"
            ;;
        alpine)
            PKG_MANAGER="apk"
            log "✓ 检测到 Alpine (使用 apk)"
            ;;
        *)
            warning "未测试的操作系统: $OS"
            ;;
    esac
}

# ============================================
# 2. 安装基础依赖
# ============================================
install_prerequisites() {
    log "📦 安装基础依赖..."
    
    case $PKG_MANAGER in
        apt-get)
            apt-get update -qq
            apt-get install -y -qq curl git unzip ufw nginx certbot python3-certbot-nginx
            ;;
        yum)
            yum install -y -q curl git unzip firewalld nginx
            ;;
        dnf)
            dnf install -y -q curl git unzip firewalld nginx
            ;;
        apk)
            apk add --no-cache curl git unzip nginx
            ;;
    esac
    
    log "✓ 基础依赖安装完成"
}

# ============================================
# 3. 安装 Node.js
# ============================================
install_nodejs() {
    log "📦 安装 Node.js $REQUIRED_NODE_VERSION..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge "$REQUIRED_NODE_VERSION" ]; then
            log "✓ Node.js v${NODE_VERSION} 已安装，跳过"
            return
        fi
    fi
    
    # 安装 NodeSource
    curl -fsSL "https://deb.nodesource.com/setup_${REQUIRED_NODE_VERSION}.x" | bash - 2>/dev/null
    
    case $PKG_MANAGER in
        apt-get)
            apt-get install -y -qq nodejs
            ;;
        yum)
            yum install -y -q nodejs
            ;;
        dnf)
            dnf install -y -q nodejs
            ;;
    esac
    
    log "✓ Node.js $(node -v) 安装完成"
}

# ============================================
# 4. 安装 PM2 (进程管理器)
# ============================================
install_pm2() {
    log "📦 安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log "✓ PM2 已安装"
    else
        npm install -g pm2 --silent 2>/dev/null
        log "✓ PM2 安装完成"
    fi
}

# ============================================
# 5. 克隆或更新代码
# ============================================
deploy_code() {
    log "📥 部署代码..."
    
    if [ -z "$GIT_REPO" ]; then
        warning "未指定 Git 仓库，将使用本地代码"
        if [ -d "$APP_DIR" ]; then
            cd "$APP_DIR"
            git pull 2>/dev/null || warning "无法更新代码"
        fi
        return
    fi
    
    if [ -d "$APP_DIR" ]; then
        log "代码目录已存在，更新中..."
        cd "$APP_DIR"
        git pull
    else
        log "克隆代码仓库..."
        git clone "$GIT_REPO" "$APP_DIR"
        cd "$APP_DIR"
    fi
    
    # 复制环境配置文件
    if [ ! -f "$APP_DIR/.env.production" ] && [ -f "$APP_DIR/.env.example" ]; then
        cp "$APP_DIR/.env.example" "$APP_DIR/.env.production"
        warning "请编辑 $APP_DIR/.env.production 配置文件"
    fi
    
    log "✓ 代码部署完成"
}

# ============================================
# 6. 安装应用依赖
# ============================================
install_app_dependencies() {
    log "📦 安装应用依赖..."
    
    # 后端依赖
    if [ -d "$APP_DIR/backend" ]; then
        log "   安装后端依赖..."
        cd "$APP_DIR/backend"
        npm install --production --silent 2>&1 | tail -2
    fi
    
    # 前端依赖
    if [ -d "$APP_DIR/frontend" ]; then
        log "   安装前端依赖..."
        cd "$APP_DIR/frontend"
        npm install --silent 2>&1 | tail -2
    fi
    
    cd "$APP_DIR"
    log "✓ 应用依赖安装完成"
}

# ============================================
# 7. 构建应用
# ============================================
build_app() {
    log "🔨 构建应用..."
    
    # 构建前端
    if [ -d "$APP_DIR/frontend" ]; then
        log "   构建前端..."
        cd "$APP_DIR/frontend"
        npm run build 2>&1 | tail -5
    fi
    
    # 构建后端
    if [ -d "$APP_DIR/backend" ]; then
        log "   构建后端..."
        cd "$APP_DIR/backend"
        if grep -q '"build"' package.json; then
            npm run build 2>&1 | tail -5
        fi
    fi
    
    cd "$APP_DIR"
    log "✓ 应用构建完成"
}

# ============================================
# 8. 配置 systemd 服务
# ============================================
setup_systemd_services() {
    log "⚙️  配置 systemd 服务..."
    
    # 后端服务
    cat > /etc/systemd/system/${APP_NAME}-backend.service << EOF
[Unit]
Description=Auto选品 Backend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/backend
ExecStart=/usr/bin/node mock-server.js
Restart=always
RestartSec=10
StandardOutput=append:${APP_DIR}/logs/backend.log
StandardError=append:${APP_DIR}/logs/backend.log
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    # 前端服务
    cat > /etc/systemd/system/${APP_NAME}-frontend.service << EOF
[Unit]
Description=Auto选品 Frontend Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/frontend
ExecStart=/usr/bin/npm --prefix ${APP_DIR}/frontend start
Restart=always
RestartSec=10
StandardOutput=append:${APP_DIR}/logs/frontend.log
StandardError=append:${APP_DIR}/logs/frontend.log
Environment=NODE_ENV=production
Environment=PORT=${FRONTEND_PORT}

[Install]
WantedBy=multi-user.target
EOF

    # 重载 systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable ${APP_NAME}-backend.service
    systemctl enable ${APP_NAME}-frontend.service
    
    log "✓ systemd 服务配置完成"
}

# ============================================
# 9. 配置 PM2 服务 (替代方案)
# ============================================
setup_pm2_services() {
    log "⚙️  配置 PM2 服务..."
    
    mkdir -p "$APP_DIR/logs"
    
    # 启动后端
    cd "$APP_DIR/backend"
    pm2 delete ${APP_NAME}-backend 2>/dev/null || true
    pm2 start npm --name "${APP_NAME}-backend" -- start "mock" 2>&1 | tail -3
    
    # 启动前端
    cd "$APP_DIR/frontend"
    pm2 delete ${APP_NAME}-frontend 2>/dev/null || true
    pm2 start npm --name "${APP_NAME}-frontend" -- start 2>&1 | tail -3
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置开机自启
    pm2 startup 2>&1 | tail -3
    
    cd "$APP_DIR"
    log "✓ PM2 服务配置完成"
}

# ============================================
# 10. 配置 Nginx
# ============================================
setup_nginx() {
    log "⚙️  配置 Nginx..."
    
    cat > /etc/nginx/conf.d/${APP_NAME}.conf << EOF
# 后端 API 反向代理
upstream backend {
    server 127.0.0.1:${BACKEND_PORT};
    keepalive 64;
}

# 前端反向代理
upstream frontend {
    server 127.0.0.1:${FRONTEND_PORT};
    keepalive 64;
}

# HTTP 服务器
server {
    listen 80;
    server_name _;
    
    # 重定向到 HTTPS (如果需要)
    # return 301 https://\$host\$request_uri;
    
    # 前端
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 后端 API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTPS 配置 (注释掉，如需启用请取消注释并配置证书)
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
#     ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
#     
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
#     ssl_prefer_server_ciphers off;
#     
#     location / {
#         proxy_pass http://frontend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host \$host;
#         proxy_cache_bypass \$http_upgrade;
#     }
#     
#     location /api {
#         proxy_pass http://backend;
#         proxy_http_version 1.1;
#         proxy_set_header Host \$host;
#     }
# }
EOF

    # 测试 Nginx 配置
    if nginx -t 2>/dev/null; then
        systemctl enable nginx
        systemctl restart nginx
        log "✓ Nginx 配置完成并已启动"
    else
        warning "Nginx 配置测试失败，请检查配置"
    fi
}

# ============================================
# 11. 配置防火墙
# ============================================
setup_firewall() {
    log "🔥 配置防火墙..."
    
    case $PKG_MANAGER in
        apt-get)
            if command -v ufw &> /dev/null; then
                ufw --force enable
                ufw allow ssh
                ufw allow http
                ufw allow https
                ufw reload
            fi
            ;;
        yum|dnf)
            if command -v firewall-cmd &> /dev/null; then
                systemctl enable firewalld
                systemctl start firewalld
                firewall-cmd --permanent --add-service=http
                firewall-cmd --permanent --add-service=https
                firewall-cmd --reload
            fi
            ;;
    esac
    
    log "✓ 防火墙配置完成"
}

# ============================================
# 12. 启动服务
# ============================================
start_services() {
    log "🚀 启动服务..."
    
    # 选择服务管理器
    USE_PM2="${USE_PM2:-true}"
    
    if [ "$USE_PM2" = "true" ]; then
        setup_pm2_services
    else
        setup_systemd_services
        systemctl start ${APP_NAME}-backend.service
        systemctl start ${APP_NAME}-frontend.service
    fi
    
    # 启动 Nginx
    systemctl restart nginx
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    log "📊 检查服务状态..."
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        log "✓ 后端服务运行正常"
    else
        warning "后端服务可能未正常启动"
    fi
    
    if curl -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
        log "✓ 前端服务运行正常"
    else
        warning "前端服务可能未正常启动"
    fi
}

# ============================================
# 13. 获取服务器信息
# ============================================
show_info() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 部署完成！${NC}"
    echo ""
    echo -e "${GREEN}🌐 访问地址：${NC}"
    
    # 获取IP
    if command -v ip &> /dev/null; then
        SERVER_IP=$(ip route get 1 | awk '{print $(NF-2); exit}')
    elif command -v curl &> /dev/null; then
        SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    else
        SERVER_IP="your-server-ip"
    fi
    
    echo -e "   http://${SERVER_IP}"
    echo ""
    echo -e "${BLUE}📡 API地址: ${NC}http://${SERVER_IP}:${BACKEND_PORT}"
    echo ""
    echo -e "${BLUE}📁 应用目录: ${NC}${APP_DIR}"
    echo ""
    echo -e "${BLUE}📝 日志目录: ${NC}${APP_DIR}/logs"
    echo ""
    echo -e "${BLUE}📋 管理命令:${NC}"
    
    if [ "$USE_PM2" = "true" ]; then
        echo "   查看状态: pm2 status"
        echo "   查看日志: pm2 logs"
        echo "   重启服务: pm2 restart all"
    else
        echo "   后端: systemctl status ${APP_NAME}-backend"
        echo "   前端: systemctl status ${APP_NAME}-frontend"
        echo "   重启后端: systemctl restart ${APP_NAME}-backend"
        echo "   重启前端: systemctl restart ${APP_NAME}-frontend"
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  重要提示:${NC}"
    echo "   1. 请编辑 ${APP_DIR}/.env.production 配置文件"
    echo "   2. 配置数据库连接信息"
    echo "   3. 设置 JWT_SECRET 等安全密钥"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================
# 主流程
# ============================================
main() {
    show_banner
    
    # 必须以 root 运行
    if [ "$EUID" -ne 0 ]; then
        error "请使用 root 权限运行此脚本: sudo $0"
    fi
    
    log "开始一键部署..."
    echo ""
    
    detect_os
    install_prerequisites
    install_nodejs
    install_pm2
    deploy_code
    install_app_dependencies
    build_app
    setup_nginx
    setup_firewall
    start_services
    show_info
    
    log "🎉 部署完成！"
}

# 解析参数
case "${2:-}" in
    --systemd)
        USE_PM2="false"
        ;;
    --pm2)
        USE_PM2="true"
        ;;
    --help|-h)
        echo "用法: $0 [GIT_REPO] [--systemd|--pm2]"
        echo ""
        echo "参数:"
        echo "  GIT_REPO     Git 仓库地址 (可选)"
        echo "  --systemd    使用 systemd 管理服务"
        echo "  --pm2        使用 PM2 管理服务 (默认)"
        echo "  --help       显示此帮助信息"
        exit 0
        ;;
esac

main
