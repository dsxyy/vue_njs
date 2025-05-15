import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import config from '../config.json';  // 新增：引入配置文件

// 配置axios（修改baseURL）
axios.defaults.baseURL = config.API_BASE_URL;  // 替换原硬编码地址
axios.defaults.timeout = 5000
axios.defaults.headers.common['Content-Type'] = 'application/json;charset=utf-8'
axios.defaults.headers.common['Accept'] = 'application/json;charset=utf-8'

// 添加请求拦截器
axios.interceptors.request.use(
  config => {
    console.log('请求拦截器触发:', config); // 检查是否触发请求拦截器
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.log('请求拦截器错误:', error); // 检查请求拦截器是否出错
    return Promise.reject(error)
  }
)

// 添加响应拦截器
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')