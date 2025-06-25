/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-25 21:04:25
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-05-23 07:39:22
 * @FilePath: /poker-server/backend/src/models/Score.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    trim: true
  },
  userid: {
    type: String,
    required: false,
    trim: true
  },
  hands: {
    type: Number,
    required: true,
    min: 1
  },
  white: {
    type: Number,
    required: true,
    min: 0
  },
  green: {
    type: Number,
    required: true,
    min: 0
  },
  red: {
    type: Number,
    required: true,
    min: 0
  },
  purple: {
    type: Number,
    required: true,
    min: 0
  },
  yellow: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: function() {
      // 创建北京时间（UTC+8）
      return new Date(Date.now() + 8 * 60 * 60 * 1000);
    }
  }
});

// 虚拟属性：总积分
scoreSchema.virtual('totalScore').get(function() {
  return (
    this.white * 10 +
    this.green * 20 +
    this.red * 100 +
    this.purple * 500 +
    this.yellow * 2000
  );
});
// 虚拟属性：积分换算
scoreSchema.virtual('totalAmount').get(function() {
  return (
    this.white * 0.5 +
    this.green * 1 +
    this.red * 5 +
    this.purple * 25 +
    this.yellow * 100
  );
});

// 虚拟属性：盈亏积分
scoreSchema.virtual('profit').get(function() {
  return this.totalScore - this.hands * 2000;
});

// 虚拟属性：盈亏金额
scoreSchema.virtual('profitMoney').get(function() {
  return this.totalAmount - this.hands * 100;
});

// 设置toJSON选项，包含虚拟属性
scoreSchema.set('toJSON', { virtuals: true });
scoreSchema.set('toObject', { virtuals: true });

const Score = mongoose.model('Score', scoreSchema);

module.exports = Score;