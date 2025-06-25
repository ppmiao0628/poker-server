const Router = require('koa-router');
const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ERROR_CODES, SUCCESS_CODES } = require('../constants/errorCodes');

const router = new Router();

// 微信小程序登录
router.post('/login', async (ctx) => {
  const { code } = ctx.request.body;

  // 验证必填字段
  if (!code) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '缺少code参数' };
    return;
  }

  try {
    // 小程序的appid和secret应该存储在环境变量中
    const appid = 'todo';
    const secret = 'todo';

    if (!appid || !secret) {
      ctx.status = 500;
      ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器配置错误' };
      return;
    }

    // 请求微信服务器获取openid和session_key
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    const response = await axios.get(url);

    const { openid, session_key, errcode, errmsg } = response.data;

    // 处理微信服务器返回的错误
    if (errcode) {
      console.error('微信登录失败:', errmsg);
      ctx.status = 400;
      ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: `微信登录失败: ${errmsg}` };
      return;
    }

    // 查找或创建用户
    let user = await User.findOne({ openid });

    // if (user) {
    //   // 删除user，然后重新创建
    //   await User.deleteOne({ openid });
    //   return;
    // }
    if (!user) {
      // 创建新用户
      user = new User({
        username: `wx_${openid}`, // 使用openid作为用户名
        password: Math.random().toString(36).substring(2, 10), // 随机密码
        openid: openid,
        isAdmin: false // 微信登录用户只有一个是管理员
      });
      await user.save();
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username, isAdmin: user.isAdmin, openid: user.openid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // 微信小程序登录token有效期设置长一些
    );

    ctx.body = {
      success: true,
      message: '登录成功',
      // user: {
      //   id: user._id,
      //   username: user.username,
      //   isAdmin: user.isAdmin
      // },
      openid,
      session_key,
      ret_code: SUCCESS_CODES.SUCCESS,
      token: token
    };
  } catch (error) {
    console.error('微信登录错误:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

// 获取用户信息
router.get('/userinfo', async (ctx) => {
  // 从请求参数中获取token
  const token = ctx.query.token || ctx.request.body.token;

  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '未授权' };
    return;
  }

  try {
    // 验证JWT令牌
    const jwtSecret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecret);

    // 查找用户
    const user = await User.findById(decoded.id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { success: false, ret_code: ERROR_CODES.USERNAME_ERROR, message: '用户不存在' };
      return;
    }

    ctx.body = {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
      },
      ret_code: SUCCESS_CODES.SUCCESS
    };
  } catch (error) {
    console.error('获取用户信息错误:', error);
    if (error.name === 'TokenExpiredError') {
      ctx.status = 401;
      ctx.body = { success: false, ret_code: ERROR_CODES.TOKEN_EXPIRED, message: '登录已过期' };
    } else {
      ctx.status = 401;
      ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '无效的登录信息' };
    }
  }
});

module.exports = router;