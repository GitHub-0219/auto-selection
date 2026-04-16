#!/bin/bash

# Auto选品 - 一键启动脚本
# 使用方法：./start-demo.sh

echo "========================================"
echo "   Auto选品 - 本地Demo一键启动"
echo "========================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装 Node.js"
    echo "   请访问 https://nodejs.org 下载安装"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误：Node.js 版本过低（当前 v$(node -v)）"
    echo "   需要版本 >= 18.0"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查后端依赖
echo "📦 检查后端依赖..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "   安装后端依赖中..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        exit 1
    fi
fi
echo "✅ 后端依赖已就绪"
echo ""

# 检查前端依赖
echo "📦 检查前端依赖..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "   安装前端依赖中..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
fi
echo "✅ 前端依赖已就绪"
echo ""

# 启动后端
echo "🚀 启动后端服务..."
cd ../backend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run mock"' 2>/dev/null || \
gnome-terminal -e "bash -c 'cd $(pwd) && npm run mock; exec bash'" 2>/dev/null || \
xterm -e "cd $(pwd) && npm run mock" 2>/dev/null || \
{
    echo "正在后台启动后端..."
    npm run mock > /dev/null 2>&1 &
    BACKEND_PID=$!
    echo "后端PID: $BACKEND_PID"
}

sleep 3
echo "✅ 后端已启动：http://localhost:3001"
echo ""

# 启动前端
echo "🚀 启动前端服务..."
cd ../frontend
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"' 2>/dev/null || \
gnome-terminal -e "bash -c 'cd $(pwd) && npm run dev; exec bash'" 2>/dev/null || \
xterm -e "cd $(pwd) && npm run dev" 2>/dev/null || \
{
    echo "正在后台启动前端..."
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    echo "前端PID: $FRONTEND_PID"
}

sleep 5

echo ""
echo "========================================"
echo "   ✅ 启动完成！"
echo "========================================"
echo ""
echo "📍 访问地址："
echo "   前端：http://localhost:3000"
echo "   后端：http://localhost:3001/api"
echo ""
echo "🔐 演示账号："
echo "   邮箱：任意有效邮箱"
echo "   密码：demo123"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止服务"
echo "   - 查看 README.md 了解更多"
echo ""
