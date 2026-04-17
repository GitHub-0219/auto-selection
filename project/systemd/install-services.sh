#!/bin/bash
# Auto选品 - systemd 服务安装脚本
# 用于将服务安装到 /etc/systemd/system/

set -e

APP_DIR="${1:-/opt/auto-selection}"
SYSTEMD_DIR="/etc/systemd/system"
APP_NAME="auto-select"

echo "📦 安装 systemd 服务..."

# 复制服务文件
cp "${APP_DIR}/systemd/${APP_NAME}-backend.service" "${SYSTEMD_DIR}/"
cp "${APP_DIR}/systemd/${APP_NAME}-frontend.service" "${SYSTEMD_DIR}/"

# 更新服务文件中的路径
sed -i "s|/opt/auto-selection|${APP_DIR}|g" "${SYSTEMD_DIR}/${APP_NAME}-backend.service"
sed -i "s|/opt/auto-selection|${APP_DIR}|g" "${SYSTEMD_DIR}/${APP_NAME}-frontend.service"

# 重载 systemd
systemctl daemon-reload

# 启用服务
systemctl enable "${APP_NAME}-backend.service"
systemctl enable "${APP_NAME}-frontend.service"

echo ""
echo "✅ 服务已安装并设置为开机自启"
echo ""
echo "📋 管理命令:"
echo "   启动后端: systemctl start ${APP_NAME}-backend"
echo "   启动前端: systemctl start ${APP_NAME}-frontend"
echo "   查看状态: systemctl status ${APP_NAME}-backend"
echo "   重启服务: systemctl restart ${APP_NAME}-backend ${APP_NAME}-frontend"
echo "   停止服务: systemctl stop ${APP_NAME}-backend ${APP_NAME}-frontend"
