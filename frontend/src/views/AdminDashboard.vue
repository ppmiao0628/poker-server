<template>
  <div class="admin-dashboard">
    <h1 class="page-title">积分汇总</h1>
    
    <div class="dashboard-header">
      <div class="date-selector">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="fetchScoresByDate"
        ></el-date-picker>
      </div>
      
      <div class="code-generator">
        <el-button type="primary" @click="generateCode">生成验证码</el-button>
        <span v-if="verificationCode" class="verification-code">{{ verificationCode }}</span>
      </div>
      
      <div class="refresh-button">
        <el-button type="info" @click="refreshScores">刷新数据</el-button>
      </div>
    </div>
    
    <div class="score-list">
      <el-table :data="scores" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="nickname" label="昵称" width="120"></el-table-column>
        <el-table-column prop="hands" label="手数" width="80"></el-table-column>
        
        <el-table-column label="白色" width="80">
          <template #default="scope">
            <div class="white-bg chip-cell">{{ scope.row.white }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="绿色" width="80">
          <template #default="scope">
            <div class="green-bg chip-cell">{{ scope.row.green }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="红色" width="80">
          <template #default="scope">
            <div class="red-bg chip-cell">{{ scope.row.red }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="紫色" width="80">
          <template #default="scope">
            <div class="purple-bg chip-cell">{{ scope.row.purple }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="黄色" width="80">
          <template #default="scope">
            <div class="yellow-bg chip-cell">{{ scope.row.yellow }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="总积分" width="100">
          <template #default="scope">
            {{ calculateTotalScore(scope.row) }}
          </template>
        </el-table-column>
        
        <el-table-column label="盈亏积分" width="100">
          <template #default="scope">
            <span :class="getProfitClass(calculateProfit(scope.row))">
              {{ calculateProfit(scope.row) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="盈亏金额" width="100">
          <template #default="scope">
            <span :class="getProfitClass(calculateProfitMoney(scope.row))">
              {{ calculateProfitMoney(scope.row) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <div class="operation-buttons">
              <el-button
                type="primary"
                size="small"
                @click="editScore(scope.row)"
              >编辑</el-button>
            <el-button
              type="danger" 
              size="small" 
              @click="deleteScore(scope.row._id)"
            >删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑积分对话框 -->
    <el-dialog
      title="编辑积分记录"
      v-model="editDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="80px" v-loading="editLoading">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        <el-form-item label="手数">
          <el-input-number v-model="editForm.hands" :min="1" placeholder="请输入手数"></el-input-number>
        </el-form-item>
        <el-form-item label="白色筹码">
          <el-input-number v-model="editForm.white" :min="0" placeholder="白色筹码数量"></el-input-number>
        </el-form-item>
        <el-form-item label="绿色筹码">
          <el-input-number v-model="editForm.green" :min="0" placeholder="绿色筹码数量"></el-input-number>
        </el-form-item>
        <el-form-item label="红色筹码">
          <el-input-number v-model="editForm.red" :min="0" placeholder="红色筹码数量"></el-input-number>
        </el-form-item>
        <el-form-item label="紫色筹码">
          <el-input-number v-model="editForm.purple" :min="0" placeholder="紫色筹码数量"></el-input-number>
        </el-form-item>
        <el-form-item label="黄色筹码">
          <el-input-number v-model="editForm.yellow" :min="0" placeholder="黄色筹码数量"></el-input-number>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="editForm.createdAt"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          ></el-date-picker>
        </el-form-item>
        <el-form-item v-if="editForm._id">
          <div class="score-summary">
            <div>总积分: <span>{{ calculateTotalScore(editForm) }}</span></div>
            <div>盈亏积分:
              <span :class="getProfitClass(calculateProfit(editForm))">
                {{ calculateProfit(editForm) }}
              </span>
            </div>
            <div>盈亏金额:
              <span :class="getProfitClass(calculateProfitMoney(editForm))">
                {{ calculateProfitMoney(editForm) }}
              </span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEditedScore" :loading="editLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { io } from 'socket.io-client'

// 状态变量
const scores = ref([])
const loading = ref(false)
const verificationCode = ref('')
// 默认今天（北京时间）
const selectedDate = ref(new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().split('T')[0])
let socket = null

// 编辑相关状态
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editForm = ref({
  nickname: '',
  hands: 1,
  white: 0,
  green: 0,
  red: 0,
  purple: 0,
  yellow: 0
})

// 生命周期钩子
onMounted(() => {
  connectSocket()
  fetchScoresByDate()
})

onUnmounted(() => {
  disconnectSocket()
})

// WebSocket连接
const connectSocket = () => {
  socket = io('https://ppmiao.top', { path: '/poker/socket.io' })
  
  socket.on('connect', () => {
    console.log('Socket connected')
  })
  
  socket.on('newScore', (newScore) => {
    // 只有当前日期的数据才添加到列表（使用北京时间比较）
    if (new Date(newScore.createdAt).toISOString().split('T')[0] === selectedDate.value) {
      scores.value.unshift(newScore)
    }
  })
  
  socket.on('scoreDeleted', (deletedId) => {
    const index = scores.value.findIndex(score => score._id === deletedId)
    if (index !== -1) {
      scores.value.splice(index, 1)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })
  
  socket.on('error', (error) => {
    console.error('Socket error:', error)
    ElMessage.error('实时数据连接失败，请刷新页面重试')
  })
}

const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// 生成验证码
const generateCode = async () => {
  try {
    loading.value = true
    // const key = Math.random().toString(36).substring(2, 8) // 生成随机key
    const key = 'score_submission' // 生成随机key
    const response = await axios.get(`/api/code/generate?key=${key}`)
    verificationCode.value = response.data.code
    ElMessage.success('验证码生成成功')
  } catch (error) {
    console.error('生成验证码失败:', error)
    ElMessage.error('生成验证码失败，请重试')
  } finally {
    loading.value = false
  }
}

// 按日期获取积分数据
const fetchScoresByDate = async () => {
  if (!selectedDate.value) return
  
  try {
    loading.value = true
    const response = await axios.get(`/api/scores?date=${selectedDate.value}`)
    scores.value = response.data.scores
  } catch (error) {
    console.error('获取积分数据失败:', error)
    ElMessage.error('获取积分数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshScores = () => {
  fetchScoresByDate()
}

// 编辑积分记录
const editScore = (score) => {
  // 格式化日期时间
  const createdAtDate = new Date(score.createdAt)
  const formattedDate = createdAtDate.toISOString().replace('T', ' ').substring(0, 19)

  // 复制积分记录到编辑表单
  editForm.value = {
    _id: score._id,
    nickname: score.nickname,
    userid: score.userid || '',
    hands: score.hands,
    white: score.white,
    green: score.green,
    red: score.red,
    purple: score.purple,
    yellow: score.yellow,
    createdAt: formattedDate
  }

  // 显示编辑对话框
  editDialogVisible.value = true
}

// 保存编辑后的积分记录
const saveEditedScore = async () => {
  // 验证表单
  if (!editForm.value.nickname || !editForm.value.hands) {
    ElMessage.warning('昵称和手数不能为空')
    return
  }

  try {
    editLoading.value = true

    // 发送更新请求
    const response = await axios.put(`/api/scores/${editForm.value._id}`, {
      nickname: editForm.value.nickname,
      userid: editForm.value.userid,
      hands: editForm.value.hands,
      white: editForm.value.white,
      green: editForm.value.green,
      red: editForm.value.red,
      purple: editForm.value.purple,
      yellow: editForm.value.yellow,
      createdAt: editForm.value.createdAt
    })

    if (response.data.success) {
      ElMessage.success('更新成功')

      // 更新本地数据
      const index = scores.value.findIndex(score => score._id === editForm.value._id)
      if (index !== -1) {
        scores.value[index] = response.data.score
      }

      // 关闭对话框
      editDialogVisible.value = false
    } else {
      ElMessage.error(response.data.message || '更新失败')
    }
  } catch (error) {
    console.error('更新积分记录失败:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    editLoading.value = false
  }
}

// 删除积分记录
const deleteScore = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条积分记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    await axios.delete(`/api/scores/${id}`)
    ElMessage.success('删除成功')
    
    // 从列表中移除
    const index = scores.value.findIndex(score => score._id === id)
    if (index !== -1) {
      scores.value.splice(index, 1)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除积分记录失败:', error)
      ElMessage.error('删除失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

// 计算总积分
const calculateTotalScore = (score) => {
  return (
    score.white * 10 +
    score.green * 20 +
    score.red * 100 +
    score.purple * 500 +
    score.yellow * 2000
  )
}

// 计算盈亏积分
const calculateProfit = (score) => {
  return calculateTotalScore(score) - score.hands * 2000
}

// 计算盈亏金额
const calculateProfitMoney = (score) => {
  return (calculateProfit(score) / 20).toFixed(2)
}

// 获取盈亏的CSS类
const getProfitClass = (value) => {
  return parseFloat(value) > 0 ? 'profit-positive' : 'profit-negative'
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.verification-code {
  margin-left: 10px;
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.chip-cell {
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

.operation-buttons {
  display: flex;
  gap: 8px;
}

.score-summary {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.score-summary div {
  margin-bottom: 5px;
}

.profit-positive {
  color: #67c23a;
  font-weight: bold;
}

.profit-negative {
  color: #f56c6c;
  font-weight: bold;
}
</style>