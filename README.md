# GitHub仓库修复与服务器部署指南

## 问题描述
GitHub仓库中的中文目录名"项目"在服务器上clone后显示为乱码，导致找不到backend/frontend目录。

---

## 方案一：本地修复并推送（推荐）

### 步骤1：在本地执行修复脚本
```bash
cd /app/data/所有对话/主对话
chmod +x fix-git-repo.sh
./fix-git-repo.sh
```

### 步骤2：或者手动执行
```bash
# 1. 重命名目录
mv 项目 project

# 2. 进入项目
cd project

# 3. 更新.gitignore中的路径（如果有中文路径引用）
sed -i 's|项目/|project/|g' .gitignore

# 4. Git提交
git add -A
git commit -m "refactor: 将中文目录名改为英文project"

# 5. 推送到GitHub
git remote set-url origin https://github.com/GitHub-0219/auto-selection.git
git push -u origin main
```
**提示**: 使用HTTPS推送需要GitHub Personal Access Token，格式：
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/GitHub-0219/auto-selection.git
```

---

## 方案二：直接在GitHub网页修改

1. 打开 https://github.com/GitHub-0219/auto-selection
2. 点击 "项目" 文件夹
3. 点击右上角 "..." -> "Rename"
4. 改为 "project"
5. 等待几秒后刷新，目录名自动同步

---

## 服务器部署

### 方式1：一键部署（推荐）
```bash
# 将deploy.sh上传到服务器后执行
chmod +x deploy.sh
./deploy.sh
```

### 方式2：手动部署
```bash
# 1. SSH连接服务器
ssh zzp_server@139.226.175.192

# 2. 克隆项目
cd /opt
sudo git clone https://github.com/GitHub-0219/auto-selection.git
sudo chown -R zzp_server:zzp_server auto-selection

# 3. 进入项目
cd auto-selection/project

# 4. 部署后端
cd backend
npm install
npm run build
pm2 start npm --name "backend" -- start

# 5. 部署前端
cd ../frontend
npm install
npm run build

# 6. 配置Nginx
sudo vim /etc/nginx/sites-available/auto-selection
# 粘贴以下内容:
'''
server {
    listen 80;
    server_name _;
    
    location / {
        root /opt/auto-selection/project/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
'''

sudo ln -sf /etc/nginx/sites-available/auto-selection /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 部署验证

```bash
# 检查PM2状态
pm2 status

# 检查端口
netstat -tlnp | grep -E '3001|5173|80'

# 检查服务
curl http://localhost:3001/api/health
curl http://localhost

# 查看日志
pm2 logs auto-selection-backend
```

---

## 访问地址

- 前端地址: http://139.226.175.192
- 后端API: http://139.226.175.192:3001/api

---

## 生成的文件

1. `deploy.sh` - 服务器一键部署脚本
2. `fix-git-repo.sh` - Git仓库修复脚本
3. `README.md` - 本操作指南
