import { createRouter, createWebHistory } from 'vue-router'

import InicioVista from '../vistas/InicioVista.vue'
import LobbyVista from '../vistas/LobbyVista.vue'
import RankingVista from '../vistas/RankingVista.vue'
import RondaVista from '../vistas/RondaVista.vue'
import ResultadosVista from '../vistas/ResultadosVista.vue'
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
      component: RondaVista,
      meta: { requiereSesion: true },
    },
    {
      path: '/partida/:partidaId/ronda/:rondaId/resultados',
      name: 'resultados',
      component: ResultadosVista,
      meta: { requiereSesion: true },
    },
    {
      path: '/partida/:partidaId/ranking',
      name: 'ranking',
      component: RankingVista,
      meta: { requiereSesion: true },
    },
  ],
})

router.beforeEach((destino) => {
  return redireccionPorSesion(destino, obtenerSesion())
})

export default router
