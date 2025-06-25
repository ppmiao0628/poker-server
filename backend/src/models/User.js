/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-24 18:51:20
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-03-24 20:41:08
 * @FilePath: /poker-server/backend/src/models/User.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  openid: {
    type: String,
    unique: true,
    sparse: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: function() {
      // 创建北京时间（UTC+8）
      return new Date(Date.now() + 8 * 60 * 60 * 1000);
    }
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才重新加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;