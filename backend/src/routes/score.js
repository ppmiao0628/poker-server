/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-05-08 19:03:36
 * @LastEditors: ppm 
 * @LastEditTime: 2025-05-23 10:13:03
 * @FilePath: /poker-server/backend/src/routes/score.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const Router = require('koa-router');
const Score = require('../models/Score');
const Code = require('../models/Code');
const jwt = require('jsonwebtoken');
const socketIO = require('socket.io');
const { ERROR_CODES, SUCCESS_CODES } = require('../constants/errorCodes');
const { handleJwtVerify } = require('../utils/jwt-error');
const router = new Router();

// 获取当天的日期字符串（YYYY-MM-DD格式，北京时间）
const getTodayDateString = () => {
  // 创建北京时间（UTC+8）
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
};

// 根据日期获取积分记录（使用北京时间）
const getScoresByDate = async (dateString) => {
  // 创建日期对象（已经是北京时间的日期字符串）
  const startDate = new Date(dateString);
  const endDate = new Date(dateString);
  endDate.setDate(endDate.getDate() + 1);

  return await Score.find({
    createdAt: {
      $gte: startDate,
      $lt: endDate
    }
  }).sort({ createdAt: -1 });
};

// 提交积分记录
router.post('/', async (ctx) => {
  const { nickname, userid, hands, white, green, red, purple, yellow, code, userCreatedAt } = ctx.request.body;

  // 验证必填字段
  if (!nickname || !hands || code === undefined) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '缺少必要参数哦' };
    return;
  }

  try {
    // 验证验证码
    const key = 'score_submission';
    const codeDoc = await Code.findOne({ key });

    if (!codeDoc || codeDoc.code !== code) {
      ctx.status = 400;
      ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '验证码不对哦' };
      return;
    }
    // 如果已存在，校验code有效期，1小时过期，未过期则返回已有的验证码
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
    if (codeDoc) {
      // 检查验证码是否过期（1小时 = 3600000毫秒）
      const createdAt = new Date(codeDoc.createdAt);
      const timeDiff = now - createdAt;
      // 如果验证码未过期,10min，直接返回
      if (timeDiff > 600000) {
        ctx.status = 400;
        ctx.body = { success: false, ret_code: ERROR_CODES.CAPTCHA_INVALID, message: '验证码过期了' };
        return;
      }
    }
    let scoreObj = {
      nickname,
      userid,
      hands,
      white: white || 0,
      green: green || 0,
      red: red || 0,
      purple: purple || 0,
      yellow: yellow || 0
    }
    // 如果提供了createdAt，则更新创建时间（转换为北京时间UTC+8）
    if (userCreatedAt) {
      // 先创建Date对象，然后加上8小时转为北京时间
      const userDate = new Date(userCreatedAt);
      userDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      scoreObj = {
        ...scoreObj,
        createdAt: userDate.toISOString(),
      }
    }
    // 创建新的积分记录
    const score = new Score(scoreObj);
    console.log('ppm score-78', score);

    await score.save();

    // 获取当天的所有积分记录
    // const todayScores = await getScoresByDate(getTodayDateString());
    // // 通过Socket.io广播更新
    // if (ctx.app.io) {
    //   ctx.app.io.emit('scores_updated', { scores: todayScores });
    // }

    ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, message: '积分提交成功' };
  } catch (error) {
    console.error('提交积分失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

// 更新积分记录（需要管理员权限）
router.put('/:id', async (ctx) => {
  // 验证管理员权限（支持H5和小程序）
  const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '未授权' };
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

  // 验证管理员权限
  if (!result.decoded.isAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '仅管理员可修改' };
    return;
  }

  const { id } = ctx.params;
  const { nickname, userid, hands, white, green, red, purple, yellow, createdAt } = ctx.request.body;

  // 验证必填字段
  if (!nickname || !hands) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '缺少必要参数' };
    return;
  }

  try {
    // 查找并更新积分记录
    const updateData = {
      nickname,
      userid,
      hands,
      white: white || 0,
      green: green || 0,
      red: red || 0,
      purple: purple || 0,
      yellow: yellow || 0
    };

    // 如果提供了createdAt，则更新创建时间（转换为北京时间UTC+8）
    if (createdAt) {
      // 先创建Date对象，然后加上8小时转为北京时间
      const createdAtDate = new Date(createdAt);
      updateData.createdAt = new Date(createdAtDate.getTime() + 8 * 60 * 60 * 1000);
    }

    const updatedScore = await Score.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedScore) {
      ctx.status = 404;
      ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '积分记录不存在' };
      return;
    }

    // 获取当天的所有积分记录
    const todayScores = await getScoresByDate(getTodayDateString());

    // 通过Socket.io广播更新
    // if (ctx.app.io) {
    //   ctx.app.io.emit('scores_updated', { scores: todayScores });
    // }

    ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, message: '更新成功', score: updatedScore };
  } catch (error) {
    console.error('更新积分记录失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});
//
// // 获取单个积分记录（需要管理员权限）
// router.get('/:id', async (ctx) => {
//   // 验证管理员权限（支持H5和小程序）
//   const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
//   if (!token) {
//     ctx.status = 401;
//     ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '未授权' };
//     return;
//   }
//
//   // 使用handleJwtVerify函数处理JWT验证
//   const jwtSecret = process.env.JWT_SECRET;
//   const result = handleJwtVerify(jwt.verify, token, jwtSecret);
//
//   if (!result.success) {
//     ctx.status = result.status;
//     ctx.body = { success: false, ret_code: result.ret_code, message: result.message };
//     return;
//   }
//
//   // 验证管理员权限
//   if (!result.decoded.isAdmin) {
//     ctx.status = 403;
//     ctx.body = { success: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '仅管理员可查看' };
//     return;
//   }
//
//   const { id } = ctx.params;
//
//   try {
//     const score = await Score.findById(id);
//
//     if (!score) {
//       ctx.status = 404;
//       ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '积分记录不存在' };
//       return;
//     }
//
//     ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, score };
//   } catch (error) {
//     console.error('获取积分记录失败:', error);
//     ctx.status = 500;
//     ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
//   }
// });

// 获取积分记录（需要管理员权限）
router.get('/', async (ctx) => {
  // 验证管理员权限（支持H5和小程序）
  const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '未授权' };
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

  // 验证管理员权限
  if (!result.decoded.isAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '仅管理员可查看' };
    return;
  }

  try {
    // 获取日期参数，默认为今天（使用北京时间）
    const queryDate = ctx.query.date || null;
    const date = queryDate || getTodayDateString();

    // 获取指定日期的积分记录
    const scores = await getScoresByDate(date);

    ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, scores };
  } catch (error) {
    console.error('获取积分记录失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

// 删除积分记录的通用处理函数
const handleDeleteScore = async (ctx, id) => {
  // 验证管理员权限（支持H5和小程序）
  const token = ctx.cookies.get('token') || ctx.query.token || ctx.request.body.token;
  if (!token) {
    ctx.status = 401;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_TOKEN, message: '未授权' };
    return false;
  }

  // 使用handleJwtVerify函数处理JWT验证
  const jwtSecret = process.env.JWT_SECRET;
  const result = handleJwtVerify(jwt.verify, token, jwtSecret);

  if (!result.success) {
    ctx.status = result.status;
    ctx.body = { success: false, ret_code: result.ret_code, message: result.message };
    return false;
  }

  // 验证管理员权限
  if (!result.decoded.isAdmin) {
    ctx.status = 403;
    ctx.body = { success: false, ret_code: ERROR_CODES.NO_ADMIN_PERMISSION, message: '权限不足' };
    return false;
  }

  try {
    // 删除积分记录
    await Score.findByIdAndDelete(id);

    // 获取当天的所有积分记录
    const todayScores = await getScoresByDate(getTodayDateString());

    // 通过Socket.io广播更新
    // if (ctx.app.io) {
    //   ctx.app.io.emit('scores_updated', { scores: todayScores });
    // }

    ctx.body = { success: true, ret_code: SUCCESS_CODES.SUCCESS, message: '删除成功' };
    return true;
  } catch (error) {
    console.error('删除积分记录失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
    return false;
  }
};

// 删除积分记录（需要管理员权限）- DELETE方法（H5端使用）
router.delete('/:id', async (ctx) => {
  const { id } = ctx.params;
  await handleDeleteScore(ctx, id);
});

// 删除积分记录（需要管理员权限）- POST方法（小程序端使用）
router.post('/delete/:id', async (ctx) => {
  const { id } = ctx.params;
  await handleDeleteScore(ctx, id);
});

// 删除积分记录（需要管理员权限）- POST方法（小程序端使用，通过请求体传递ID）
router.post('/delete', async (ctx) => {
  const { id } = ctx.request.body;
  if (!id) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PARAMS, message: '缺少ID参数' };
    return;
  }
  await handleDeleteScore(ctx, id);
});

// 获取个人积分记录（按昵称查询，无需登录）
router.get('/personal', async (ctx) => {
  const { nickname, userid, page = 1, limit = 10, Platform } = ctx.query;
  if (userid) {
    // 如果提供了userid参数，直接查询userid对应的记录
    try {
      // 计算分页参数
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const pageSize = parseInt(limit);
      // 查询总记录数
      const total = await Score.countDocuments({ userid });
      // 查询分页数据
      const records = await Score.find({ userid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
      ctx.body = {
        success: true,
        records,
        total,
        page: parseInt(page),
        limit: pageSize,
        ret_code: SUCCESS_CODES.SUCCESS,
        pages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('获取个人积分记录失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
    }
    return;
  }
  // 兜底H5平台
  if (!nickname) {
    ctx.status = 400;
    ctx.body = { success: false, ret_code: ERROR_CODES.INVALID_PERSON_KEY, message: '请退出重试' };
    return;
  }
  try {
    // 计算分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);
    // 查询总记录数
    const total = await Score.countDocuments({ nickname });
    // 查询分页数据
    const records = await Score.find({ nickname })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    ctx.body = {
      success: true,
      records,
      total,
      page: parseInt(page),
      limit: pageSize,
      ret_code: SUCCESS_CODES.SUCCESS,
      pages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取个人积分记录失败:', error);
    ctx.status = 500;
    ctx.body = { success: false, ret_code: ERROR_CODES.SYSTEM_ERROR, message: '服务器错误' };
  }
});

module.exports = router;