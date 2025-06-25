<!--
 * @Author: ppm ppmiao0628@outlook.com
 * @Date: 2025-03-25 21:04:25
 * @LastEditors: ppmiao 
 * @LastEditTime: 2025-06-03 17:46:59
 * @FilePath: /poker-server/frontend/src/App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="app">
    <div class="app-header" v-if="isAiChat">
      <router-link to="/ai-chat.html" class="nav-item">AI对话</router-link>
    </div>
    <div class="app-header" v-else>
      <div class="logo">积分记录系统</div>
      <div class="nav-menu">
        <router-link to="/index.html" class="nav-item">积分录入</router-link>
        <router-link to="/records.html" class="nav-item">个人记录</router-link>
        <router-link to="/ai-chat.html" class="nav-item">AI对话</router-link>
        <router-link to="/admin.html" v-if="isAdminRoute" class="nav-item">管理员</router-link>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isAiChat = computed(() => route.path.startsWith('/ai-chat'))
// const isRecordsRoute = computed(() => route.path.startsWith('/records'))
</script>

<style>
.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem 2rem 2rem;
  font-weight: normal;
}

body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #dcdfe6;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color, #409eff);
}

.nav-menu {
  display: flex;
  gap: 1.5rem;
}

.nav-item {
  text-decoration: none;
  color: var(--text-color, #303133);
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
}

.nav-item:hover {
  color: var(--primary-color, #409eff);
}

.nav-item.router-link-active {
  color: var(--primary-color, #409eff);
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color, #409eff);
}
</style>