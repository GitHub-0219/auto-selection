#!/bin/bash
# ==========================================
# Auto选品 - 本地一键部署脚本
# AI跨境新手加速器 - 本地开发环境启动
# ==========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 端口配置
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Auto选品 - 本地一键部署脚本${NC}"
echo -e "${BLUE}   AI跨境新手加速器${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# ==========================================
# 1. 检查 Node.js 是否安装
# ==========================================
echo -e "${YELLOW}[1/6] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装！${NC}"
    echo -e "${YELLOW}请先安装 Node.js (推荐 v18+):${NC}"
    echo "  macOS: brew install node"
    echo "  Ubuntu: sudo apt install nodejs npm"
    echo "  Windows: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠ Node.js 版本过低 (当前: v${NODE_VERSION}, 推荐: v18+)${NC}"
fi
echo -e "${GREEN}✓ Node.js 已安装: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm 未安装！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 已安装: $(npm -v)${NC}"
echo ""

# ==========================================
# 2. 检查端口占用情况
# ==========================================
echo -e "${YELLOW}[2/6] 检查端口占用...${NC}"

check_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ 端口 $port ($name) 已被占用${NC}"
        echo -e "   占用进程: $(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null | xargs -I {} ps -p {} -o comm= 2>/dev/null || echo '未知')"
        return 1
    else
        echo -e "${GREEN}✓ 端口 $port ($name) 可用${NC}"
        return 0
    fi
}

PORT_OK=true
check_port $BACKEND_PORT "后端API" || PORT_OK=false
check_port $FRONTEND_PORT "前端服务" || PORT_OK=false

if [ "$PORT_OK" = false ]; then
    echo ""
    echo -e "${YELLOW}是否继续部署？(可能需要手动终止占用端口的进程)${NC}"
    read -p "继续执行 (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
fi
echo ""

# ==========================================
# 3. 安装后端依赖
# ==========================================
echo -e "${YELLOW}[3/6] 安装后端依赖...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "正在安装后端依赖 (首次安装可能需要几分钟)..."
    npm install --silent
    echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
else
    echo -e "${GREEN}✓ 后端依赖已存在，跳过安装${NC}"
fi
echo ""

# ==========================================
# 4. 安装前端依赖
# ==========================================
echo -e "${YELLOW}[4/6] 安装前端依赖...${NC}"
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "正在安装前端依赖 (首次安装可能需要几分钟)..."
    npm install --silent
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
else
    echo -e "${GREEN}✓ 前端依赖已存在，跳过安装${NC}"
fi
echo ""

# ==========================================
# 5. 启动后端 Mock 服务
# ==========================================
echo -e "${YELLOW}[5/6] 启动后端服务...${NC}"
cd "$BACKEND_DIR"

# 后台启动后端服务
nohup node mock-server.js > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"

# 等待服务启动
echo "等待后端服务启动..."
for i in {1..10}; do
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "${RED}✗ 后端服务启动失败！${NC}"
    echo "查看日志: cat $PROJECT_ROOT/logs/backend.log"
    exit 1
fi
echo ""

# ==========================================
# 6. 启动前端服务
# ==========================================
echo -e "${YELLOW}[6/6] 启动前端服务...${NC}"
cd "$FRONTEND_DIR"

# 后台启动前端服务
nohup npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"

# 等待服务启动
echo "等待前端服务启动..."
for i in {1..15}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

if ! curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 前端服务可能需要更长时间启动${NC}"
fi
echo ""

# ==========================================
# 完成信息
# ==========================================
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}   部署完成！${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${GREEN}服务访问地址:${NC}"
echo -e "  前端: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  后端: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo ""
echo -e "${GREEN}测试账号:${NC}"
echo -e "  邮箱: ${YELLOW}demo@example.com${NC}"
echo -e "  密码: ${YELLOW}任意密码${NC}"
echo "  (演示模式可直接登录)"
echo ""
echo -e "${GREEN}真实注册:${NC}"
echo -e "  访问 http://localhost:$FRONTEND_PORT/register"
echo ""
echo -e "${GREEN}日志文件:${NC}"
echo -e "  后端: ${YELLOW}$PROJECT_ROOT/logs/backend.log${NC}"
echo -e "  前端: ${YELLOW}$PROJECT_ROOT/logs/frontend.log${NC}"
echo ""
echo -e "${GREEN}进程管理:${NC}"
echo -e "  查看后端日志: ${YELLOW}tail -f $PROJECT_ROOT/logs/backend.log${NC}"
echo -e "  查看前端日志: ${YELLOW}tail -f $PROJECT_ROOT/logs/frontend.log${NC}"
echo -e "  停止所有服务: ${YELLOW}kill \$(cat $PROJECT_ROOT/logs/*.pid)${NC}"
echo ""
echo -e "${BLUE}按 Ctrl+C 保持服务运行...${NC}"

# 保持脚本运行
trap "echo ''; echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f $PROJECT_ROOT/logs/*.pid; exit" INT TERM
wait
