#!/bin/bash

# AI跨境新手加速器 - 一键启动脚本
# 确保后端和前端都可以正常运行

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 AI跨境新手加速器 - 本地演示Demo启动器              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装Node.js${NC}"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  建议使用Node.js 18+以获得最佳体验${NC}"
fi

echo -e "${GREEN}✓ Node.js ${NODE_VERSION} 检测正常${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "📁 项目目录: $PROJECT_ROOT"
echo ""

# 安装后端依赖
echo -e "${BLUE}📦 安装后端依赖...${NC}"
cd "$PROJECT_ROOT/项目/backend"
if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -5
fi
echo -e "${GREEN}✓ 后端依赖安装完成${NC}"

# 安装前端依赖
echo ""
echo -e "${BLUE}📦 安装前端依赖...${NC}"
cd "$PROJECT_ROOT/项目/frontend"
if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -5
fi
echo -e "${GREEN}✓ 前端依赖安装完成${NC}"

# 返回项目目录
cd "$PROJECT_ROOT"

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ 安装完成！请按以下步骤启动：${NC}"
echo ""
echo -e "${BLUE}步骤1:${NC} 启动后端Mock API服务器"
echo -e "      ${YELLOW}cd 项目/backend && npm run mock${NC}"
echo ""
echo -e "${BLUE}步骤2:${NC} 另开终端，启动前端开发服务器"
echo -e "      ${YELLOW}cd 项目/frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌐 访问地址：${NC}"
echo "      前端: http://localhost:3000"
echo "      后端: http://localhost:3001"
echo ""
echo -e "${GREEN}💡 演示账号: 任意邮箱 + 密码 'demo123'${NC}"
echo ""
echo -e "${GREEN}✅ 准备就绪！${NC}"
