import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/',
    redirect: '/versions',
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/versions',
    name: 'Versions',
    component: () => import('../views/VersionsView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/scenes',
    name: 'Scenes',
    component: () => import('../views/ScenesView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/UsersView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/devices',
    name: 'Devices',
    component: () => import('../views/DevicesView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/families',
    name: 'Families',
    component: () => import('../views/FamilyView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  
]

const router = createRouter({
  history: createWebHistory('/manager/'),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const tokenExpiresAt = localStorage.getItem('tokenExpiresAt')
  
  // 检查token是否存在且未过期
  const isTokenValid = token && tokenExpiresAt && new Date().getTime() < parseInt(tokenExpiresAt)
  
  if (to.meta.requiresAuth && !isTokenValid) {
    // 如果token不存在或已过期，清除所有认证信息并重定向到登录页
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpiresAt')
    next('/login')
  } else if (to.path === '/login' && isTokenValid) {
    next('/')
  } else {
    next()
  }
})

export default router 