/**
 * 全局错误处理中间件
 */
const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('服务器错误:', err);
    
    // 设置状态码
    ctx.status = err.status || 500;
    
    // 设置响应体
    ctx.body = {
      success: false,
      message: err.message || '服务器内部错误',
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    };
    
    // 触发应用级别的错误事件
    ctx.app.emit('error', err, ctx);
  }
};

module.exports = {
  errorHandler
};