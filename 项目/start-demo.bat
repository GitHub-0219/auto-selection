@echo off
chcp 65001 >nul
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║     🚀 AI跨境新手加速器 - 本地演示Demo启动器              ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% 检测正常

:: 获取当前目录
set PROJECT_ROOT=%~dp0..\..
set PROJECT_ROOT=%PROJECT_ROOT:~0,-1%

echo.
echo 📁 项目目录: %PROJECT_ROOT%
echo.

:: 安装后端依赖
echo 📦 安装后端依赖...
cd /d "%PROJECT_ROOT%\项目\backend"
if not exist "node_modules" (
    call npm install
)
echo ✓ 后端依赖安装完成

:: 安装前端依赖
echo.
echo 📦 安装前端依赖...
cd /d "%PROJECT_ROOT%\项目\frontend"
if not exist "node_modules" (
    call npm install
)
echo ✓ 前端依赖安装完成

:: 返回项目目录
cd /d "%PROJECT_ROOT%"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ✅ 安装完成！请按以下步骤启动：
echo.
echo 步骤1: 启动后端Mock API服务器
echo       cd 项目\backend ^&^& npm run mock
echo.
echo 步骤2: 另开终端，启动前端开发服务器
echo       cd 项目\frontend ^&^& npm run dev
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 🌐 访问地址：
echo       前端: http://localhost:3000
echo       后端: http://localhost:3001
echo.
echo 💡 演示账号: 任意邮箱 + 密码 'demo123'
echo.
echo ✅ 准备就绪！
pause
