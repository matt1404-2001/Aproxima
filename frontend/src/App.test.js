import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.vue'

const dobles = vi.hoisted(() => ({
  recuperarSesion: vi.fn(),
  esErrorSesionDefinitivo: vi.fn(),
  obtenerSesion: vi.fn(),
  guardarSesion: vi.fn(),
  eliminarSesion: vi.fn(),
}))

vi.mock('./servicios/servicioPartidas', () => ({
  recuperarSesion: dobles.recuperarSesion,
  esErrorSesionDefinitivo: dobles.esErrorSesionDefinitivo,
}))

vi.mock('./servicios/servicioSesion', () => ({
  obtenerSesion: dobles.obtenerSesion,
  guardarSesion: dobles.guardarSesion,
  eliminarSesion: dobles.eliminarSesion,
}))

function crearRouterPrueba() {
  const componente = { template: '<p>Vista</p>' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'inicio', component: componente },
      { path: '/partida/:partidaId/lobby', name: 'lobby', component: componente },
      { path: '/partida/:partidaId/ronda/:rondaId', name: 'ronda', component: componente },
      {
        path: '/partida/:partidaId/ronda/:rondaId/resultados',
        name: 'resultados',
        component: componente,
      },
      { path: '/partida/:partidaId/ranking', name: 'ranking', component: componente },
    ],
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  dobles.esErrorSesionDefinitivo.mockReturnValue(false)
  dobles.guardarSesion.mockReturnValue(true)
})

describe('App', () => {
  it('recupera la sesión y navega según el estado oficial', async () => {
    const sesion = {
      partidaId: 42,
      rol: 'ANFITRION',
      token: 'privado',
      persistente: true,
    }
    dobles.obtenerSesion.mockReturnValue(sesion)
    dobles.recuperarSesion.mockResolvedValue({
      rol: 'ANFITRION',
      jugador: null,
      estadoPartida: {
        partidaId: 42,
        codigo: 'AB12C',
        estado: 'LOBBY',
      },
    })
    const router = crearRouterPrueba()
    await router.push('/')
    await router.isReady()

    mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(dobles.recuperarSesion).toHaveBeenCalledWith(42, 'privado')
    expect(dobles.guardarSesion).toHaveBeenCalledWith({
      ...sesion,
      codigo: 'AB12C',
      rol: 'ANFITRION',
      jugador: null,
    })
    expect(router.currentRoute.value.name).toBe('lobby')
  })

  it('elimina una credencial inválida y vuelve al inicio', async () => {
    dobles.obtenerSesion.mockReturnValue({
      partidaId: 42,
      rol: 'JUGADOR',
      token: 'inválido',
    })
    const error = { codigo: 'CREDENCIAL_INVALIDA' }
    dobles.recuperarSesion.mockRejectedValue(error)
    dobles.esErrorSesionDefinitivo.mockReturnValue(true)
    const router = crearRouterPrueba()
    await router.push('/partida/42/lobby')
    await router.isReady()

    mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(dobles.eliminarSesion).toHaveBeenCalledOnce()
    expect(router.currentRoute.value).toMatchObject({
      name: 'inicio',
      query: { sesion: 'invalida' },
    })
  })

  it('conserva la sesión y ofrece reintentar ante un fallo temporal', async () => {
    dobles.obtenerSesion.mockReturnValue({
      partidaId: 42,
      rol: 'JUGADOR',
      token: 'privado',
    })
    dobles.recuperarSesion.mockRejectedValue(new Error('Sin red'))
    dobles.esErrorSesionDefinitivo.mockReturnValue(false)
    const router = crearRouterPrueba()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    expect(dobles.eliminarSesion).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Tu lugar sigue reservado.')
    expect(wrapper.get('button').text()).toBe('Reintentar conexión')
  })
})
