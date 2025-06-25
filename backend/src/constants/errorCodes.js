/*
 * @Author: ppm 
 * @Date: 2025-04-28 16:06:12
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-05-08 21:47:15
 * @FilePath: /poker-server/backend/src/constants/errorCodes.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 
### 1. 通用错误（1000-1999）
- 1000: 系统未知错误
- 1001: 服务暂时不可用
- 1002: 请求参数无效
### 2. 认证授权类（2000-2999）
- 2000: 未授权访问
- 2001: 登录失败
- 2002: 令牌无效
- 2003: 令牌过期
### 3. 用户相关（3000-3999）
- 3000: 用户不存在
- 3001: 用户已存在
- 3002: 密码错误
### 4. 业务相关（4000-9999）
 */
const ERROR_CODES = {
  /** 系统未知错误 */
  SYSTEM_ERROR: 10000001,
  /** 入参无效或者缺少入参 */
  INVALID_PARAMS: 10000002,

  /** 未授权访问,缺少token */
  INVALID_TOKEN: 20000000,
  /** token过期 */
  TOKEN_EXPIRED: 20000001,
  /** 未授权访问,无管理员权限 */
  NO_ADMIN_PERMISSION: 20000002,
  /** 密码错误 */
  INVALID_PASSWORD: 20000003,
  /** 用户名不存在 */
  USERNAME_ERROR: 20000004,
  /** 密码错误 */
  PASSWORD_ERROR: 20000005,
  /** 验证码失效 */
  CAPTCHA_INVALID: 20000006,

  /** 缺少生成验证码的入参 */
  KEY_EMPTY: 40000000,
  /** 特殊-查询积分的个人入参无效 */
  INVALID_PERSON_KEY: 40000001,
}
const SUCCESS_CODES = {
  /** 成功 */
  SUCCESS: 0,
}

module.exports = {
  SUCCESS_CODES,
  ERROR_CODES,
};