/*
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-25 21:04:25
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-04-11 07:35:24
 * @FilePath: /poker-server/frontend/src/router/index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import App from '../App.vue'
import EmptyLayout from '../components/EmptyLayout.vue'

// 验证管理员登录状态
const checkAdminAuth = async () => {
  try {
    const response = await axios.get('/api/auth/check')
    return response.data.isAuthenticated
  } catch (error) {
    return false
  }
}

const router = createRouter({
  history: createWebHistory('/poker/'),
  base: '/poker/index.html',
  routes: [
    {
      path: '/index.html',
      name: 'home',
      component: () => import('../views/ScoreInput.vue'),
      meta: { title: '积分录入' }
    },
    {
      path: '/score-only.html',
      name: 'scoreOnly',
      component: EmptyLayout,
      children: [
        {
          path: '',
          component: () => import('../views/ScoreInput.vue'),
          meta: { title: '积分录入' }
        }
      ]
    },
    {
      path: '/records.html',
      name: 'records',
      component: () => import('../views/PersonalRecords.vue'),
      meta: { title: '个人积分记录' }
    },
    {
      path: '/login.html',
      name: 'login',
      component: () => import('../views/AdminLogin.vue'),
      meta: { title: '管理员登录' }
    },
    {      path: '/admin.html',
      name: 'admin',
      component: () => import('../views/AdminDashboard.vue'),
      meta: { title: '积分汇总', requiresAuth: true }
    },
    {
      path: '/ai-chat.html',
      name: 'aiChat',
      component: () => import('../views/AIChat.vue'),
      meta: { title: 'AI对话' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/index.html'
    }
  ]
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 积分记录系统` : '积分记录系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const isAuthenticated = await checkAdminAuth()
    if (!isAuthenticated) {
      ElMessage.warning('请先登录')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

export default router