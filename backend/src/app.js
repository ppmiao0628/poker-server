/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-04-09 21:59:19
 * @LastEditors: ppm 
 * @LastEditTime: 2025-06-12 16:25:59
 * @FilePath: /poker-server/backend/src/app.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

// 导入路由
const authRoutes = require('./routes/auth');
const codeRoutes = require('./routes/code');
const scoreRoutes = require('./routes/score');
const wechatRoutes = require('./routes/wechat');
const aiRoutes = require('./routes/ai');
// 导入中间件
const { errorHandler } = require('./middleware/errorHandler');

// 创建Koa应用
const app = new Koa();
app.proxy = true;
const router = new Router();

// 创建HTTP服务器
const server = http.createServer(app.callback());

// 创建Socket.io实例
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 连接MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/poker';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 全局中间件
app.use(cors());
app.use(bodyParser());
app.use(errorHandler);
// 允许跨域请求
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 按需添加
  // if (ctx.method === 'OPTIONS') {
  //   ctx.status = 204; // 显式返回空响应
  //   return;
  // }
  await next();
});
// 路由前缀
router.prefix('/poker/api');

// 注册路由
router.use('/auth', authRoutes.routes());
router.use('/code', codeRoutes.routes());
router.use('/scores', scoreRoutes.routes());
router.use('/wechat', wechatRoutes.routes());
router.use('/ai', aiRoutes.routes());

// 使用路由中间件
app.use(router.routes()).use(router.allowedMethods());

// 将Socket.io实例添加到应用上下文
app.context.io = io;

// Socket.io连接处理
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };