/*
 * @Author: ppm 
 * @Date: 2025-03-24 18:51:20
 * @LastEditors: ppm ppmiao0628@outlook.com
 * @LastEditTime: 2025-04-04 22:05:30
 * @FilePath: /poker-server/frontend/vite.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 添加Node.js全局变量polyfill
const nodePolyfills = {
  name: 'node-polyfills',
  setup(build) {
    // 提供crypto模块的polyfill
    build.onResolve({ filter: /^crypto$/ }, () => {
      return { path: 'crypto-browserify' }
    })
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/poker/',
  plugins: [
    vue(), 
    nodePolyfills,
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  define: {
    // 提供全局变量polyfill
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-js'
    }
  },
  build: {
    outDir: 'dist/poker',
    // 提高警告阈值，默认为500kb
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        // 手动分包配置
        manualChunks: {
          // 将vue相关库打包在一起
          'vue-vendor': ['vue', 'vue-router'],
          // 将element-plus单独打包
          'element-plus': ['element-plus'],
          // 将其他第三方库打包在一起
          'vendor': ['axios', 'socket.io-client', 'crypto-js']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/poker/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/poker/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})