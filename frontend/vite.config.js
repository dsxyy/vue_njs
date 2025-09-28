import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import config from './config.json';  // 新增：引入配置文件

export default defineConfig({
  base: '/manager/',
  plugins: [vue()],
  server: {
    host:'0.0.0.0',
    port: 5100,
    allowedHosts: [
      'localhost',
      'test.mmradar.inchitech.com',
      '172.16.20.202'
    ],
    proxy: {
      '/api': {
        target: config.API_BASE_URL,
        changeOrigin: true,
        secure: false,  // 允许无效证书
        //  rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
