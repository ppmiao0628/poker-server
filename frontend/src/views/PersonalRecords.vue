<template>
  <div class="personal-records">
    <div class="records-container">
      <h1 class="page-title">个人积分记录</h1>
      
      <div class="search-form">
        <el-form :inline="true">
          <el-form-item label="昵称">
            <el-input v-model="searchNickname" placeholder="请输入昵称" clearable @keyup.enter="searchRecords"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchRecords" :loading="loading">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-if="records.length > 0" class="records-list">
        <el-table :data="records" stripe style="width: 100%" v-loading="loading">
          <el-table-column prop="createdAt" label="日期" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
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
              {{ scope.row.totalScore }}
            </template>
          </el-table-column>
          
          <el-table-column label="盈亏积分" width="100">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.profit)">
                {{ scope.row.profit }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="盈亏金额" width="100">
            <template #default="scope">
              <span :class="getProfitClass(scope.row.profitMoney)">
                {{ scope.row.profitMoney }}
              </span>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalRecords"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
      
      <div v-else-if="!loading" class="no-records">
        <el-empty description="暂无积分记录"></el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 状态变量
const records = ref([])
const loading = ref(false)
const searchNickname = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)

// 生命周期钩子
onMounted(() => {
  // 初始加载时不自动查询，等待用户输入昵称
})

// 格式化日期（处理北京时间）
const formatDate = (dateString) => {
  // 日期字符串已经是北京时间，直接格式化即可
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] + ' ' + date.toISOString().split('T')[1].slice(0, 8)
}

// 获取盈亏的CSS类
const getProfitClass = (value) => {
  return parseFloat(value) > 0 ? 'profit-positive' : 'profit-negative'
}

// 查询个人积分记录
const searchRecords = async () => {
  if (!searchNickname.value.trim()) {
    ElMessage.warning('请输入昵称')
    return
  }
  
  try {
    loading.value = true
    const response = await axios.get(`/api/scores/personal?nickname=${encodeURIComponent(searchNickname.value)}&page=${currentPage.value}&limit=${pageSize.value}`)
    
    if (response.data.success) {
      records.value = response.data.records
      totalRecords.value = response.data.total
      
      if (records.value.length === 0) {
        ElMessage.info('未找到相关记录')
      }
    } else {
      ElMessage.error(response.data.message || '查询失败')
    }
  } catch (error) {
    console.error('查询个人积分记录失败:', error)
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理每页显示数量变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 重置到第一页
  searchRecords()
}

// 处理页码变化
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  searchRecords()
}
</script>

<style scoped>
.personal-records {
  padding: 20px;
}

.records-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-form {
  margin-bottom: 20px;
}

.chip-cell {
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

.no-records {
  margin-top: 40px;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>