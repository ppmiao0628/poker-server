/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-25 21:04:25
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-04-29 06:33:25
 * @FilePath: /poker-server/backend/src/models/Code.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: function() {
      // 创建北京时间（UTC+8）
      return new Date(Date.now() + 8 * 60 * 60 * 1000);
    },
    expires: 3600 // 1小时后自动过期
  }
});

const Code = mongoose.model('Code', codeSchema);

module.exports = Code;