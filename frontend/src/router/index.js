import { createRouter, createWebHistory } from 'vue-router'

import InicioVista from '../vistas/InicioVista.vue'
import EstadoPartidaVista from '../vistas/EstadoPartidaVista.vue'
import LobbyVista from '../vistas/LobbyVista.vue'
import { obtenerSesion } from '../servicios/servicioSesion'
import { redireccionPorSesion } from '../utilidades/rutasPartida'

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
      meta: { requiereSesion: true },
    },
    {
      path: '/partida/:partidaId/ronda/:rondaId',
      name: 'ronda',
      component: EstadoPartidaVista,
      meta: { requiereSesion: true },
    },
    {
      path: '/partida/:partidaId/ronda/:rondaId/resultados',
      name: 'resultados',
      component: EstadoPartidaVista,
      meta: { requiereSesion: true },
    },
    {
      path: '/partida/:partidaId/ranking',
      name: 'ranking',
      component: EstadoPartidaVista,
      meta: { requiereSesion: true },
    },
  ],
})

router.beforeEach((destino) => {
  return redireccionPorSesion(destino, obtenerSesion())
})

export default router
