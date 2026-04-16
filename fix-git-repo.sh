#!/bin/bash
# 本地Git仓库修复脚本
# 将中文目录名"项目"改为英文"project"

set -e

echo "==================================="
echo "  Git仓库修复脚本"
echo "==================================="

# 1. 重命名目录
if [ -d "项目" ]; then
    echo "[1/5] 重命名目录: 项目 -> project"
    mv "项目" project
    echo "✓ 目录重命名完成"
elif [ -d "project" ]; then
    echo "[1/5] 目录已命名为 project，跳过"
else
    echo "✗ 未找到项目目录 '项目' 或 'project'"
    exit 1
fi

# 2. 进入项目目录
cd project

# 3. 更新.gitignore（如果存在中文路径引用）
echo "[2/5] 检查并更新配置文件..."
if [ -f ".gitignore" ]; then
    # 替换可能的旧路径引用
    sed -i 's|项目/|project/|g' .gitignore 2>/dev/null || true
    echo "✓ .gitignore 已更新"
fi

# 4. 添加所有更改
echo "[3/5] Git 添加所有更改..."
git add -A

# 5. 提交更改
echo "[4/5] Git 提交..."
git commit -m "refactor: 将中文目录名改为英文project

- 解决服务器端Git克隆后目录名乱码问题
- 提升跨平台兼容性"

# 6. 推送到GitHub
echo "[5/5] 推送到GitHub..."
echo ""
echo "请选择推送方式:"
echo "1. 使用GitHub Token推送"
echo "2. 生成手动推送命令"
read -p "请输入选项 (1/2): " choice

if [ "$choice" = "1" ]; then
    read -p "请输入GitHub Token: " token
    git remote set-url origin "https://${token}@github.com/GitHub-0219/auto-selection.git"
    git push -u origin main
    echo "✓ 推送完成!"
else
    echo ""
    echo "==================================="
    echo "手动推送命令:"
    echo "==================================="
    echo ""
    echo "# 方法1: 使用SSH (推荐)"
    echo "git remote set-url origin git@github.com:GitHub-0219/auto-selection.git"
    echo "git push -u origin main"
    echo ""
    echo "# 方法2: 使用HTTPS + Personal Access Token"
    echo "git remote set-url origin https://YOUR_TOKEN@github.com/GitHub-0219/auto-selection.git"
    echo "git push -u origin main"
    echo ""
    echo "# 方法3: 直接HTTPS (每次需要输入用户名密码)"
    echo "git remote set-url origin https://github.com/GitHub-0219/auto-selection.git"
    echo "git push -u origin main"
    echo ""
fi

echo ""
echo "✓ Git操作完成!"
