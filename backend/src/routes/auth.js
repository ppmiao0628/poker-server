const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { ERROR_CODES, SUCCESS_CODES } = require('../constants/errorCodes');
const { handleJwtVerify } = require('../utils/jwt-error');

const router = new Router();

// 管理员登录
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  
  // 验证用户名和密码
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.USERNAME_OR_PASSWORD_EMPTY, message: '用户名和密码不能为空' };
    return;
  }
  
  try {
    // 查找用户
    let user = await User.findOne({ username });
    // 如果用户不存在且是初始管理员账户，则创建
    if (!user && username === 'admin') {
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash('', salt);
      user = new User({
        username: 'admin',
        password: password,
        isAdmin: true
      });
      await user.save();
    }
    
    // 如果用户不存在或不是管理员
    if (!user || !user.isAdmin) {
      ctx.status = 401;
      ctx.body = { success: false, ret_code: ERROR_CODES.USERNAME_ERROR, message: '用户名不存在' };
      return;
    }
    
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      ctx.status = 401;
      ctx.body = { success: false, ret_code: ERROR_CODES.PASSWORD_ERROR, message: '用户名或密码错误' };
      return;
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 设置Cookie（H5端使用）
    ctx.cookies.set('token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1小时
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    ctx.body = {
      success: true,
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      ret_code: SUCCESS_CODES.SUCCESS,
      // 返回token到响应体中（小程序端使用）
      token: token
    };
  } catch (error) {
    console.error('登录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '系统异常' };
  }
});

// 检查认证状态
router.get('/check', async (ctx) => {
  // 从cookie或请求参数中获取token
  const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
  
  if (!token) {
    ctx.body = { isAuthenticated: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '缺少登录信息' };
    return;
  }
  
  // 使用handleJwtVerify函数处理JWT验证
  const jwtSecret = process.env.JWT_SECRET;
  const result = handleJwtVerify(jwt.verify, token, jwtSecret);
  
  if (!result.success) {
    ctx.status = result.status;
    ctx.body = { success: false, ret_code: result.ret_code, message: result.message };
    return;
  }
  
  // 检查用户是否存在且是管理员
  try {
    const user = await User.findById(result.decoded.id);
    if (!user || !user.isAdmin) {
      ctx.body = { isAuthenticated: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '无权限访问' };
      return;
    }
    
    ctx.body = { isAuthenticated: true, isAdmin: user.isAdmin, ret_code: SUCCESS_CODES.SUCCESS, message: '认证成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { isAuthenticated: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '系统异常' };
  }
});

// 退出登录
router.post('/logout', (ctx) => {
  // 清除H5端的cookie
  ctx.cookies.set('token', null, { maxAge: 0 });
  // 返回成功信息，小程序端需要自行清除存储的token
  ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, message: '退出成功', clearToken: true };
});

module.exports = router;