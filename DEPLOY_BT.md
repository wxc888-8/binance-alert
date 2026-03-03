# 宝塔面板 (BT Panel) 部署教程

本教程将指导你如何将 **币安预警系统** 部署到宝塔面板。

## 1. 环境准备

在宝塔面板的【软件商店】中安装以下软件：

1.  **Node.js 版本管理器**
    *   安装后点击设置，选择 **Node.js 18.x** (或更高版本) 进行安装。
    *   安装完成后，点击【模块】，安装 `pm2`、`yarn` (可选) 和 `pnpm` (可选)。
    *   **重要**：确保 `pm2` 已经安装。
2.  **MySQL** (推荐 5.7 或 8.0)
    *   安装后创建一个数据库，例如命名为 `alert_db`。
    *   记下 **数据库名**、**用户名** 和 **密码**。
3.  **Nginx** (通常默认已安装)

## 2. 代码上传

1.  **本地打包**：
    *   在你的电脑上，将项目文件夹打包成压缩包（例如 `project.zip`）。
    *   **注意**：不要包含 `node_modules`、`.next`、`.git` 文件夹，这些会在服务器上生成。
2.  **上传文件**：
    *   进入宝塔【文件】，进入 `/www/wwwroot/` 目录。
    *   新建文件夹，例如 `binance-alert`。
    *   进入该文件夹，上传并解压 `project.zip`。

## 3. 项目配置

1.  **配置环境变量**：
    *   在项目根目录新建一个文件 `.env`。
    *   复制以下内容并修改为你自己的配置：

    ```env
    # 数据库连接 (替换 User, Password, DbName)
    DATABASE_URL="mysql://用户名:密码@127.0.0.1:3306/数据库名"

    # Telegram 机器人 (可选，用户可在前台配置)
    TELEGRAM_TOKEN=""

    # 邮件服务 (可选，用于邮件通知)
    EMAIL_SERVICE="gmail"
    EMAIL_USER="your-email@gmail.com"
    EMAIL_PASS="your-app-password"

    # 其他
    NODE_ENV="production"
    ```

2.  **安装依赖**：
    *   在当前目录点击【终端】按钮（或通过 SSH 进入目录）。
    *   执行以下命令：

    ```bash
    # 1. 安装项目依赖
    npm install

    # 2. 生成 Prisma 客户端
    npx prisma generate

    # 3. 同步数据库结构 (将创建表结构)
    npx prisma db push

    # 4. 编译 Next.js 项目
    npm run build
    ```

    *如果遇到权限问题，请确保使用 root 用户或有足够权限的用户。*

## 4. 启动服务 (PM2)

项目根目录已经准备好了 `ecosystem.config.js` 文件，用于同时管理 Web 服务和 Worker 监控进程。

在终端执行：

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 保存当前进程列表，确保重启服务器后自动启动
pm2 save

# 生成开机自启脚本 (根据提示执行)
pm2 startup
```

执行 `pm2 status`，你应该能看到两个绿色的进程：
*   `binance-alert-web`: 网站服务
*   `binance-alert-worker`: 监控与推送进程

## 5. 域名访问 (反向代理)

1.  **添加站点**：
    *   点击宝塔【网站】->【添加站点】。
    *   **域名**：填写你的域名（如 `alert.example.com`）。
    *   **根目录**：选择项目目录 `/www/wwwroot/binance-alert`。
    *   **PHP版本**：选择【纯静态】。
2.  **设置反向代理**：
    *   点击刚创建的网站名，进入【设置】。
    *   选择左侧的【反向代理】->【添加反向代理】。
    *   **代理名称**：`NextJS` (随意填)。
    *   **目标URL**：`http://127.0.0.1:3000`
    *   **发送域名**：`$host`
    *   点击【提交】。

现在，你可以通过访问你的域名来使用系统了！

## 6. 常用维护命令

*   **查看日志** (排查报错)：
    ```bash
    pm2 logs
    ```
*   **重启服务** (代码更新或配置修改后)：
    ```bash
    pm2 restart all
    ```
*   **停止服务**：
    ```bash
    pm2 stop all
    ```
