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
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router 