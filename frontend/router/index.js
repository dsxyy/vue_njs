import DevicesView from '../views/DevicesView.vue'

const routes = [
  {
    path: '/devices',
    name: 'devices',
    component: DevicesView,
    meta: {
      requiresAuth: true,
      title: '设备管理'
    }
  },
] 