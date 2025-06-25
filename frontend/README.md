<!--
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-25 21:04:25
 * @LastEditors: ppm
 * @LastEditTime: 2025-06-11 10:30:07
 * @FilePath: /poker-server/frontend/README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

# 积分记录系统前端

这是积分记录和查看系统的前端部分，基于 Vue3 开发。

## 功能页面

- 玩家积分录入页面：任何人可访问，用于录入玩家积分信息
- 管理员登录页面：用于管理员身份验证
- 管理员汇总页面：需要管理员权限，用于查看和管理所有玩家积分信息

## 技术栈

- Vue3
- Vite
- Vue Router
- Axios
- Socket.io-client
- Element Plus

## 项目设置

node 版本建议 22.14.28

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 生产环境构建

```bash
npm run build
```

## 本地开发

在开发环境中，前端会通过 Vite 的代理功能连接到后端 API，默认后端服务地址为`http://localhost:3000`。

## 部署

构建后的文件将输出到`dist`目录，可以通过 Nginx 进行部署。详细的 Nginx 配置可以参考项目根目录下的 Nginx 配置文件。
