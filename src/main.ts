import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { UserModule } from './types'

import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

import '~/styles/index.scss'

// If you want to use ElMessage, import it.
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/overlay.scss'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const app = createApp(App)

// Install Router
app.use(router)

// Install Pinia
const pinia = createPinia()
app.use(pinia)

// install all modules under `modules/`
Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true })).forEach(
  (i) => i.install?.(app),
)

app.mount('#app')
