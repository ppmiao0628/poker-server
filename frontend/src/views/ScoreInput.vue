<template>
  <div class="score-input">
    <div class="form-container">
      <h1 class="page-title">积分录入</h1>
      
      <el-form :model="scoreForm" :rules="rules" ref="scoreFormRef" label-width="100px">
        <el-form-item v-if="hasSubmit" label="提交状态">
          <div class="profit-negative">已提交</div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input class="nick-name" v-model="scoreForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        
        <el-form-item label="买入手数" prop="hands">
          <el-input-number class="hands-number" v-model="scoreForm.hands" :min="1" :precision="0"></el-input-number>
        </el-form-item>
        
        <el-form-item label="白色" prop="white">
          <el-input-number 
            v-model="scoreForm.white" 
            :min="0" 
            :precision="0"
            class="white-bg chip-input"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="绿色" prop="green">
          <el-input-number 
            v-model="scoreForm.green" 
            :min="0" 
            :precision="0"
            class="green-bg chip-input"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="红色" prop="red">
          <el-input-number 
            v-model="scoreForm.red" 
            :min="0" 
            :precision="0"
            class="red-bg chip-input"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="紫色" prop="purple">
          <el-input-number 
            v-model="scoreForm.purple" 
            :min="0" 
            :precision="0"
            class="purple-bg chip-input"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="黄色" prop="yellow">
          <el-input-number 
            v-model="scoreForm.yellow" 
            :min="0" 
            :precision="0"
            class="yellow-bg chip-input"
          ></el-input-number>
        </el-form-item>
        
        <el-form-item label="总积分">
          <div>{{ totalScore }}</div>
        </el-form-item>
        
        <el-form-item label="盈亏积分">
          <div :class="getProfitClass(profit)">{{ profit }}</div>
        </el-form-item>
        
        <el-form-item label="盈亏金额">
          <div :class="getProfitClass(profitMoney)">{{ profitMoney }}</div>
        </el-form-item>
        
        <el-form-item label="验证码" prop="code">
          <el-input class="code" v-model="scoreForm.code" placeholder="请输入验证码"></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :disabled="hasSubmit" :loading="loading" @click="submitScore">提交</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const scoreFormRef = ref(null)
const loading = ref(false)
const hasSubmit = ref(false)

const scoreForm = reactive({
  nickname: '',
  hands: 5,
  white: 0,
  green: 0,
  red: 0,
  purple: 0,
  yellow: 0,
  code: ''
})

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  hands: [
    { required: true, message: '请输入买入手数', trigger: 'blur' },
    { type: 'number', min: 1, message: '手数必须大于0', trigger: 'blur' }
  ],
  white: [
    { required: true, message: '请输入白色筹码数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '筹码数量不能为负数', trigger: 'blur' }
  ],
  green: [
    { required: true, message: '请输入绿色筹码数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '筹码数量不能为负数', trigger: 'blur' }
  ],
  red: [
    { required: true, message: '请输入红色筹码数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '筹码数量不能为负数', trigger: 'blur' }
  ],
  purple: [
    { required: true, message: '请输入紫色筹码数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '筹码数量不能为负数', trigger: 'blur' }
  ],
  yellow: [
    { required: true, message: '请输入黄色筹码数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '筹码数量不能为负数', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

// 计算总积分
const totalScore = computed(() => {
  return (
    scoreForm.white * 10 +
    scoreForm.green * 20 +
    scoreForm.red * 100 +
    scoreForm.purple * 500 +
    scoreForm.yellow * 2000
  )
})

// 计算盈亏积分
const profit = computed(() => {
  return totalScore.value - scoreForm.hands * 2000
})

// 计算盈亏金额
const profitMoney = computed(() => {
  return (profit.value / 20).toFixed(2)
})

// 获取盈亏的CSS类
const getProfitClass = (value) => {
  return parseFloat(value) > 0 ? 'profit-positive' : 'profit-negative'
}

// 提交积分
const submitScore = async () => {
  if (!scoreFormRef.value) return
  
  try {
    await scoreFormRef.value.validate()
    
    loading.value = true
    await axios.post('/api/scores', scoreForm)
    
    ElMessage.success('提交成功')
    hasSubmit.value = true;
    // 重置表单
    // scoreForm.nickname = ''
    // scoreForm.code = ''
  } catch (error) {
    if (error.response && error.response.data.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('提交失败，请重试')
    }
    console.error('提交积分失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.score-input {
  padding: 20px;
  text-align: center;
}
.hands-number,
.chip-input {
  width: 180px;
  border-radius: 4px;
}
.hands-number :deep(.el-input__inner),
.chip-input :deep(.el-input__inner) {
  font-weight: bold;
}
.chip-input :deep(.el-input-number__decrease),
.chip-input :deep(.el-input-number__increase) {
  background-color: transparent;
  color: inherit;
}

.chip-input.white-bg :deep(.el-input__wrapper) {
  background-color: white;
  font-weight: bold;
}

.chip-input.green-bg :deep(.el-input__wrapper),
.chip-input.green-bg :deep(.el-input__inner){
  background-color: var(--success-color);
  color: white;
}

.chip-input.red-bg :deep(.el-input__wrapper),
.chip-input.red-bg :deep(.el-input__inner) {
  background-color: var(--danger-color);
  color: white;
}

.chip-input.purple-bg :deep(.el-input__wrapper),
.chip-input.purple-bg :deep(.el-input__inner) {
  background-color: #bc95ed ;
  color: white;
}

.chip-input.yellow-bg :deep(.el-input__wrapper),
.chip-input.yellow-bg :deep(.el-input__inner) {
  background-color: var(--warning-color);
  color: white;
}
</style>