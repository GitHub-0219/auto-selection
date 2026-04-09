@echo off
chcp 65001 >nul
title Auto选品 - 本地Demo启动

echo ========================================
echo    Auto选品 - 本地Demo一键启动
echo ========================================
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未安装 Node.js
    echo    请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本：%NODE_VERSION%
echo.

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 检查后端依赖
echo 📦 检查后端依赖...
cd backend
if not exist "node_modules" (
    echo    安装后端依赖中...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 后端依赖安装失败
        pause
        exit /b 1
    )
)
echo ✅ 后端依赖已就绪
echo.

:: 检查前端依赖
echo 📦 检查前端依赖...
cd ..\frontend
if not exist "node_modules" (
    echo    安装前端依赖中...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        pause
        exit /b 1
    )
)
echo ✅ 前端依赖已就绪
echo.

:: 启动后端
echo 🚀 启动后端服务...
cd ..\backend
start "Auto选品-后端" cmd /k "npm run mock"
timeout /t 3 >nul
echo ✅ 后端已启动：http://localhost:3001
echo.

:: 启动前端
echo 🚀 启动前端服务...
cd ..\frontend
start "Auto选品-前端" cmd /k "npm run dev"
timeout /t 5 >nul

echo.
echo ========================================
echo    ✅ 启动完成！
echo ========================================
echo.
echo 📍 访问地址：
echo    前端：http://localhost:3000
echo    后端：http://localhost:3001/api
echo.
echo 🔐 演示账号：
echo    邮箱：任意有效邮箱
echo    密码：demo123
echo.
echo 💡 提示：
echo    - 关闭命令行窗口即可停止服务
echo    - 查看 README.md 了解更多
echo.
pause
