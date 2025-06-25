/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-24 18:51:20
 * @LastEditors: ppm 
 * @LastEditTime: 2025-05-08 16:17:09
 * @FilePath: /poker-server/backend/src/routes/code.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const Router = require('koa-router');
const Code = require('../models/Code');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ERROR_CODES, SUCCESS_CODES } = require('../constants/errorCodes');
const { handleJwtVerify } = require('../utils/jwt-error');

const router = new Router();

// 生成6位数字验证码
const generateRandomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 生成验证码
router.get('/generate', async (ctx) => {
  // 从cookie或请求参数中获取token
  const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '缺少登录信息' };
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
      ctx.status = 403;
      ctx.body = { success: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '无权限访问' };
      return;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '系统异常' };
    return;
  }
  
  const { key } = ctx.query;
  
  if (!key) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.KEY_EMPTY, message: '缺少key参数' };
    return;
  }
  
  try {
    // 检查是否已存在相同key的验证码
    let codeDoc = await Code.findOne({ key });
    
    // 如果已存在，校验code有效期，1小时过期，未过期则返回已有的验证码
    if (codeDoc) {
      // 检查验证码是否过期（1小时 = 3600000毫秒）
      const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const createdAt = new Date(codeDoc.createdAt);
      const timeDiff = now - createdAt;
      
      // 如果验证码未过期,10min，直接返回
      if (timeDiff < 600000) {
        ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, code: codeDoc.code };
        return;
      }
      
      // 验证码已过期，删除旧验证码
      await Code.deleteOne({ key });
    }
    
    // 生成新的验证码
    const code = generateRandomCode();
    
    // 保存到数据库
    codeDoc = new Code({
      key,
      code
    });
    
    await codeDoc.save();
    
    ctx.body = { success: true, code, ret_code: SUCCESS_CODES.SUCCESS };
  } catch (error) {
    console.error('生成验证码失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

// 验证验证码
router.post('/verify', async (ctx) => {
  const { key, code } = ctx.request.body;
  
  if (!key || !code) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.KEY_EMPTY, message: '缺少key或code参数' };
    return;
  }
  
  try {
    const codeDoc = await Code.findOne({ key });
    console.log('ppm key-62', key, codeDoc);
    
    if (!codeDoc) {
      ctx.status = 400;
      ctx.body = { success: false, ret_code: ERROR_CODES.CAPTCHA_INVALID, message: '验证码不存在或已过期' };
      return;
    }
    
    if (codeDoc.code !== code) {
      ctx.status = 400;
      ctx.body = { success: false, ret_code: ERROR_CODES.CAPTCHA_INVALID, message: '验证码错误' };
      return;
    }
    
    ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, message: '验证码验证成功' };
  } catch (error) {
    console.error('验证码验证失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

module.exports = router;