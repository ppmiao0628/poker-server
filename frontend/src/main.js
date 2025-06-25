import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
// Element Plus 样式仍需全局导入
import 'element-plus/dist/index.css'
// 导入配置好的axios
import './utils/axios'
// 导入防止双击缩放的工具函数
import { setupPreventZoom } from './utils/preventZoom'

// 初始化防止双击缩放功能
setupPreventZoom()

const app = createApp(App)

app.use(router)

app.mount('#app')