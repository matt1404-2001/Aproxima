import { createRouter, createWebHistory } from 'vue-router'

import InicioVista from '../vistas/InicioVista.vue'
import LobbyVista from '../vistas/LobbyVista.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: InicioVista,
    },
    {
      path: '/partida/:partidaId/lobby',
      name: 'lobby',
      component: LobbyVista,
      props: true,
    },
  ],
})

export default router
