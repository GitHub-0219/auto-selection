# Docker配置
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动
CMD ["npm", "run", "start:prod"]
