import { createRouter, createWebHistory } from 'vue-router'

import InicioVista from '../vistas/InicioVista.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: InicioVista,
    },
  ],
})

export default router
