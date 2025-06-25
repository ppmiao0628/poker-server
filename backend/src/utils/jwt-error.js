/**
 * JWT错误处理工具函数
 * 统一处理JWT验证过程中可能出现的错误
 */
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * 处理JWT验证错误
 * @param {Function} verifyFn - JWT验证函数，通常是jwt.verify
 * @param {string} token - JWT令牌
 * @param {string} secret - 密钥
 * @param {Object} options - 验证选项
 * @returns {Object} 返回解码后的令牌信息或错误对象
 */
const handleJwtVerify = (verifyFn, token, secret, options = {}) => {
  try {
    // 执行JWT验证
    const decoded = verifyFn(token, secret, options);
    return { success: true, decoded };
  } catch (error) {
    // 处理常见的JWT错误
    if (error.name === 'TokenExpiredError') {
      return { 
        success: false, 
        status: 401,
        ret_code: ERROR_CODES.TOKEN_EXPIRED, 
        message: 'Token已过期，请重新登录' 
      };
    } else if (error.name === 'JsonWebTokenError') {
      return { 
        success: false, 
        status: 401,
        ret_code: ERROR_CODES.INVALID_TOKEN, 
        message: 'Token无效' 
      };
    } else {
      // 其他未知错误
      return { 
        success: false, 
        status: 500,
        ret_code: ERROR_CODES.SYSTEM_ERROR, 
        message: '系统异常' 
      };
    }
  }
};

module.exports = {
  handleJwtVerify
};