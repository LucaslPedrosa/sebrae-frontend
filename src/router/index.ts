import { createRouter, createWebHashHistory } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  // Hash history keeps every route reachable on static hosts such as GitHub Pages.
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true, publicLayout: true } },
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
    { path: '/market', name: 'market', component: () => import('@/views/MarketView.vue'), meta: { requiresAuth: true } },
    { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/devices', name: 'devices', component: () => import('@/views/DevicesView.vue'), meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  await auth.initialize()
  if (to.meta.requiresAuth && !auth.user) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.user) return '/dashboard'
})

export default router
