<!--
 * @Author: ppm
 * @Date: 2025-04-25 17:28:54
 * @LastEditors: ppm
 * @LastEditTime: 2025-06-11 10:06:46
 * @FilePath: /poker-server/backend/README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

# 积分记录系统后端

这是积分记录和查看系统的后端部分，基于 Koa 和 MongoDB 开发。

## 功能特点

- 管理员登录认证：JWT 认证机制，确保只有管理员可以访问管理页面
- 验证码生成：生成 6 位随机数验证码，用于验证积分录入
- 积分信息录入：接收并验证玩家提交的积分信息
- 积分信息查询：按日期查询所有玩家积分信息
- 实时数据推送：使用 Socket.io 实现新积分信息的实时推送
- 数据删除：支持删除指定的积分记录

## 技术栈

- Koa2
- MongoDB
- Socket.io
- JWT
- bcrypt

## 项目设置

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境运行

```bash
npm start
```

## 环境变量

创建`.env`文件在项目根目录，包含以下配置：

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/poker-score
JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD_HASH=hashed_password_for_admin
```

## API 文档

### 管理员登录

```
POST /api/auth/login
Body: { username, password }
```

### 验证码生成

```
GET /api/code/generate?key=<key>
```

### 积分信息录入

```
POST /api/scores
Body: { nickname, hands, white, green, red, purple, yellow, code }
```

### 积分信息查询

```
GET /api/scores?date=YYYY-MM-DD
```

### 删除积分信息

```
DELETE /api/scores/:id
```

## WebSocket

连接到`ws://localhost:3000`接收实时积分更新。

## 本地开发

在开发环境中，后端服务默认运行在`http://localhost:3000`，并允许跨域请求，方便前端开发调试。
