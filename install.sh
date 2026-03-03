#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}    Binance Alert System 一键安装脚本      ${NC}"
echo -e "${GREEN}===========================================${NC}"

# 1. 检查 Node.js 环境
echo -e "${YELLOW}[1/6] 检查环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未检测到 Node.js，请先在宝塔面板安装 Node.js (推荐 v18+)${NC}"
    exit 1
fi
echo "Node.js 版本: $(node -v)"

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}正在安装 PM2...${NC}"
    npm install -g pm2
fi

# 2. 安装依赖
echo -e "${YELLOW}[2/6] 安装项目依赖...${NC}"
npm install --legacy-peer-deps

# 3. 环境变量配置
echo -e "${YELLOW}[3/6] 配置环境变量...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}检测到 .env 文件不存在，正在创建默认配置...${NC}"
    # 尝试让用户输入数据库连接串，如果没输入则使用 SQLite 默认值
    read -p "请输入 MySQL 连接字符串 (回车使用默认 SQLite): " DB_URL
    if [ -z "$DB_URL" ]; then
        echo 'DATABASE_URL="file:./dev.db"' > .env
        echo -e "${GREEN}已配置为使用 SQLite 数据库${NC}"
    else
        echo "DATABASE_URL=\"$DB_URL\"" > .env
        echo -e "${GREEN}已配置为使用 MySQL 数据库${NC}"
    fi
    echo 'NODE_ENV="production"' >> .env
else
    echo -e "${GREEN}.env 文件已存在，跳过配置${NC}"
fi

# 4. 数据库同步
echo -e "${YELLOW}[4/6] 同步数据库结构...${NC}"
npx prisma generate
npx prisma db push

# 5. 构建项目
echo -e "${YELLOW}[5/6] 编译 Next.js 项目...${NC}"
npm run build

# 6. 启动服务
echo -e "${YELLOW}[6/6] 启动服务 (PM2)...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 > startup_script.sh
chmod +x startup_script.sh
./startup_script.sh
rm startup_script.sh

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}    部署完成！                             ${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "请在宝塔面板 -> 网站 -> 设置 -> 反向代理 中添加代理："
echo -e "目标 URL: http://127.0.0.1:3000"
