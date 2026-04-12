#!/bin/bash
# ===========================================
# Auto选品 - 安全配置检查脚本
# ===========================================
# 用途: 验证生产环境安全配置
# 使用: ./scripts/security-check.sh
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASS++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAIL++))
    fi
}

echo "=========================================="
echo "   Auto选品 - 安全配置检查"
echo "=========================================="
echo ""

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️ .env 文件不存在，跳过检查${NC}"
    exit 1
fi

# ============ 1. JWT密钥检查 ============
echo -e "\n${YELLOW}[1/6] JWT密钥安全检查${NC}"

# 检查JWT_SECRET是否存在
if [ -z "$JWT_SECRET" ]; then
    check_result 1 "JWT_SECRET未设置"
else
    # 检查长度
    if [ ${#JWT_SECRET} -ge 64 ]; then
        check_result 0 "JWT_SECRET长度符合要求 (${#JWT_SECRET}字符)"
    else
        check_result 1 "JWT_SECRET长度不足 (当前:${#JWT_SECRET}, 需要:≥64)"
    fi
    
    # 检查是否为示例值
    if echo "$JWT_SECRET" | grep -qiE "(change_me|your-|example|demo|test)"; then
        check_result 1 "JWT_SECRET仍为示例值"
    else
        check_result 0 "JWT_SECRET已更改为非示例值"
    fi
    
    # 检查弱模式
    if echo "$JWT_SECRET" | grep -qiE "(secret|password|123456|admin|root|qwerty)"; then
        check_result 1 "JWT_SECRET包含弱模式"
    else
        check_result 0 "JWT_SECRET无弱模式"
    fi
fi

# ============ 2. 数据库SSL检查 ============
echo -e "\n${YELLOW}[2/6] 数据库SSL配置检查${NC}"

if [[ "$DATABASE_URL" == *"sslmode"* ]]; then
    check_result 0 "DATABASE_URL已配置SSL"
    
    if [[ "$DATABASE_URL" == *"sslmode=require"* ]]; then
        check_result 0 "SSL模式设为require (强制)"
    elif [[ "$DATABASE_URL" == *"sslmode=prefer"* ]]; then
        check_result 1 "SSL模式为prefer (建议改为require)"
    fi
else
    check_result 1 "DATABASE_URL未配置SSL (生产环境必须)"
fi

# ============ 3. 环境模式检查 ============
echo -e "\n${YELLOW}[3/6] 环境配置检查${NC}"

if [ "$NODE_ENV" = "production" ]; then
    check_result 0 "NODE_ENV已设为production"
    
    # 生产环境额外检查
    if [[ "$DATABASE_URL" == *"localhost"* ]]; then
        check_result 1 "生产环境不应使用localhost"
    else
        check_result 0 "数据库地址符合生产环境要求"
    fi
else
    check_result 1 "NODE_ENV未设为production (当前:$NODE_ENV)"
fi

# ============ 4. 敏感文件检查 ============
echo -e "\n${YELLOW}[4/6] 敏感文件检查${NC}"

if [ -f .env ]; then
    # 检查.gitignore
    if grep -q "^\.env$" .gitignore 2>/dev/null || grep -q "^\.env" .gitignore 2>/dev/null; then
        check_result 0 ".env已添加到.gitignore"
    else
        check_result 1 ".env未添加到.gitignore"
    fi
fi

# ============ 5. 限流配置检查 ============
echo -e "\n${YELLOW}[5/6] 限流配置检查${NC}"

if [ ! -z "$LOGIN_MAX_ATTEMPTS" ] && [ "$LOGIN_MAX_ATTEMPTS" -le 5 ]; then
    check_result 0 "登录失败次数限制合理 (${LOGIN_MAX_ATTEMPTS}次)"
else
    check_result 1 "登录失败次数限制可能过高"
fi

if [ ! -z "$LOGIN_LOCKOUT_DURATION" ] && [ "$LOGIN_LOCKOUT_DURATION" -ge 300 ]; then
    check_result 0 "登录锁定时间合理 (${LOGIN_LOCKOUT_DURATION}秒)"
else
    check_result 1 "登录锁定时间可能不足"
fi

# ============ 6. API密钥检查 ============
echo -e "\n${YELLOW}[6/6] API密钥检查${NC}"

if [[ "$OPENAI_API_KEY" == *"your-"* ]] || [[ "$OPENAI_API_KEY" == *"demo"* ]]; then
    check_result 1 "OpenAI API密钥仍为示例值"
else
    check_result 0 "OpenAI API密钥已配置"
fi

# ============ 总结 ============
echo ""
echo "=========================================="
echo "   检查结果汇总"
echo "=========================================="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 所有安全检查通过！${NC}"
    exit 0
elif [ $FAIL -le 2 ]; then
    echo -e "${YELLOW}⚠️ 存在$FAIL项待改进${NC}"
    exit 0
else
    echo -e "${RED}❌ 存在$FAIL项严重问题，请修复后再部署${NC}"
    exit 1
fi
