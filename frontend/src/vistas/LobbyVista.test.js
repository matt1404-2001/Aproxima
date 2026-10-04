import { flushPromises, mount } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LobbyVista from './LobbyVista.vue'

const dobles = vi.hoisted(() => ({
  replace: vi.fn(),
  useEstadoPartida: vi.fn(),
  iniciarPartida: vi.fn(),
  esErrorSesionDefinitivo: vi.fn(),
  eliminarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  detener: vi.fn(),
  reintentar: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: dobles.replace }),
}))

vi.mock('../composables/useEstadoPartida', () => ({
  useEstadoPartida: dobles.useEstadoPartida,
}))

vi.mock('../servicios/servicioPartidas', () => ({
  iniciarPartida: dobles.iniciarPartida,
  esErrorSesionDefinitivo: dobles.esErrorSesionDefinitivo,
}))

vi.mock('../servicios/servicioSesion', () => ({
  eliminarSesion: dobles.eliminarSesion,
  obtenerSesion: dobles.obtenerSesion,
}))

function configurarEstado(rol = 'ANFITRION', cantidad = 2) {
  const jugadores = [
    { jugadorId: 1, nombre: 'María' },
    { jugadorId: 2, nombre: 'Carlos' },
  ].slice(0, cantidad)

  dobles.useEstadoPartida.mockReturnValue({
    estadoPartida: shallowRef({
      partidaId: 42,
      codigo: 'AB12C',
      estado: 'LOBBY',
      versionEstado: 2,
      rol,
      lobby: {
        cantidadJugadores: cantidad,
        maximoJugadores: 40,
        puedeIniciar: rol === 'ANFITRION' && cantidad >= 2,
        jugadores,
      },
    }),
    cargando: ref(false),
    desconectado: ref(false),
    sesionInvalida: ref(false),
    reintentar: dobles.reintentar,
    detener: dobles.detener,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  dobles.obtenerSesion.mockReturnValue({
    partidaId: 42,
    codigo: 'AB12C',
    rol: 'ANFITRION',
    token: 'privado',
    persistente: true,
  })
  dobles.esErrorSesionDefinitivo.mockReturnValue(false)
  configurarEstado()
})

describe('LobbyVista', () => {
  it('muestra la lista oficial y habilita el inicio para el anfitrión', () => {
    const wrapper = mount(LobbyVista)

    expect(wrapper.text()).toContain('2 de 40 lugares ocupados')
    expect(wrapper.text()).toContain('María')
    expect(wrapper.text()).toContain('Carlos')
    expect(wrapper.get('.boton--iniciar').attributes('disabled')).toBeUndefined()
  })

  it('inicia la partida una sola vez y navega con la respuesta oficial', async () => {
    const estadoActivo = {
      partidaId: 42,
      codigo: 'AB12C',
      estado: 'RONDA_ACTIVA',
      ronda: { rondaId: 9 },
    }
    dobles.iniciarPartida.mockResolvedValue({ estadoPartida: estadoActivo })
    const wrapper = mount(LobbyVista)

    await wrapper.get('.boton--iniciar').trigger('click')
    await flushPromises()

    expect(dobles.iniciarPartida).toHaveBeenCalledOnce()
    expect(dobles.iniciarPartida).toHaveBeenCalledWith(42, 'privado')
    expect(dobles.detener).toHaveBeenCalled()
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'ronda',
      params: { partidaId: 42, rondaId: 9 },
      state: { estadoPartida: estadoActivo },
    })
  })

  it('oculta los controles exclusivos al jugador', () => {
    dobles.obtenerSesion.mockReturnValue({
      partidaId: 42,
      rol: 'JUGADOR',
      token: 'privado',
      jugador: { jugadorId: 1, nombre: 'María' },
    })
    configurarEstado('JUGADOR', 2)

    const wrapper = mount(LobbyVista)

    expect(wrapper.find('.boton--iniciar').exists()).toBe(false)
    expect(wrapper.text()).toContain('Esperando a que el anfitrión inicie la partida.')
    expect(wrapper.text()).toContain('Tú')
  })

  it('bloquea envíos repetidos mientras inicia', async () => {
    dobles.iniciarPartida.mockReturnValue(new Promise(() => {}))
    const wrapper = mount(LobbyVista)
    const boton = wrapper.get('.boton--iniciar')

    await boton.trigger('click')
    await boton.trigger('click')

    expect(dobles.iniciarPartida).toHaveBeenCalledOnce()
    expect(boton.attributes('disabled')).toBeDefined()
  })

  it('conserva la sesión ante un acceso denegado al iniciar', async () => {
    dobles.iniciarPartida.mockRejectedValue(new Error('No tienes autorización.'))
    dobles.esErrorSesionDefinitivo.mockReturnValue(false)
    const wrapper = mount(LobbyVista)

    await wrapper.get('.boton--iniciar').trigger('click')
    await flushPromises()

    expect(dobles.eliminarSesion).not.toHaveBeenCalled()
    expect(dobles.reintentar).toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('No tienes autorización')
  })
})
