<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-content">
        <h1>管理系统</h1>
        <div class="user-info">
          <el-button link @click="handleLogout">退出登录</el-button>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/versions">
            <el-icon><Document /></el-icon>
            <span>版本管理</span>
          </el-menu-item>
          <el-menu-item index="/scenes">
            <el-icon><Location /></el-icon>
            <span>场景管理</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/devices">
            <el-icon><Monitor /></el-icon>
            <span>设备管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Document, Location, User, Monitor } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  return route.path
})



const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    localStorage.removeItem('token')
    router.push('/login')
  } catch (error) {
    // 用户取消操作，不做任何处理
  }
}
</script>

<style>
.layout-container {
  height: 100vh;
}

.header {
  background-color: #304156;
  color: white;
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header h1 {
  margin: 0;
  font-size: 20px;
}

.user-info {
  color: #bfcbd9;
  display: flex;
  gap: 10px;
}

.aside {
  background-color: #304156;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
}

.el-menu-item.is-active {
  background-color: #263445 !important;
}
</style> 