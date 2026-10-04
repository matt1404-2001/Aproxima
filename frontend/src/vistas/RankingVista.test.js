import { flushPromises, mount } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RankingVista from './RankingVista.vue'

const dobles = vi.hoisted(() => ({
  replace: vi.fn(),
  useEstadoPartida: vi.fn(),
  consultarRanking: vi.fn(),
  esDefinitivo: vi.fn(),
  eliminarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  reintentar: vi.fn(),
  detener: vi.fn(),
}))

let alActualizar

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: dobles.replace }),
}))

vi.mock('../composables/useEstadoPartida', () => ({
  useEstadoPartida: dobles.useEstadoPartida,
}))

vi.mock('../servicios/servicioPartidas', () => ({
  consultarRanking: dobles.consultarRanking,
  esErrorSesionDefinitivo: dobles.esDefinitivo,
}))

vi.mock('../servicios/servicioSesion', () => ({
  eliminarSesion: dobles.eliminarSesion,
  obtenerSesion: dobles.obtenerSesion,
}))

const rankingFinal = {
  partidaId: 42,
  tipo: 'FINAL',
  rondasCompletadas: 5,
  totalRondas: 5,
  posiciones: [
    { posicion: 1, jugadorId: 8, nombre: 'María', puntosTotales: 4200, esJugadorActual: true },
    { posicion: 1, jugadorId: 9, nombre: 'Carlos', puntosTotales: 4200, esJugadorActual: false },
  ],
  servidorAhora: '2026-10-03T16:10:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState({}, '')
  dobles.obtenerSesion.mockReturnValue({ partidaId: 42, codigo: 'AB12C', rol: 'JUGADOR', token: 'privado' })
  dobles.consultarRanking.mockResolvedValue(rankingFinal)
  dobles.esDefinitivo.mockReturnValue(false)
  dobles.useEstadoPartida.mockImplementation((_sesion, opciones) => {
    alActualizar = opciones.alActualizar
    return {
      estadoPartida: shallowRef({ partidaId: 42, codigo: 'AB12C', estado: 'FINALIZADA' }),
      desconectado: ref(false),
      sesionInvalida: ref(false),
      reintentar: dobles.reintentar,
      detener: dobles.detener,
    }
  })
})

describe('RankingVista', () => {
  it('muestra la clasificación final y conserva los empates', async () => {
    const wrapper = mount(RankingVista)
    await flushPromises()

    expect(wrapper.text()).toContain('Clasificación final')
    expect(wrapper.text()).toContain('María')
    expect(wrapper.text()).toContain('Carlos')
    expect(wrapper.findAll('.posicion').map((nodo) => nodo.text())).toEqual(['01', '01'])
    expect(dobles.consultarRanking).toHaveBeenCalledWith(42, 'privado', expect.any(AbortSignal))
  })

  it('abandona la pantalla final si el estado oficial no está finalizado', async () => {
    mount(RankingVista)
    const resultados = {
      partidaId: 42,
      estado: 'RESULTADOS',
      resultados: { rondaId: 17 },
    }

    await alActualizar(resultados)

    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'resultados',
      params: { partidaId: 42, rondaId: 17 },
      state: { estadoPartida: resultados },
    })
  })

  it('elimina una sesión inválida al consultar el ranking', async () => {
    dobles.esDefinitivo.mockReturnValue(true)
    dobles.consultarRanking.mockRejectedValue(new Error('Credencial inválida'))
    mount(RankingVista)
    await flushPromises()

    expect(dobles.eliminarSesion).toHaveBeenCalled()
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'inicio',
      query: { sesion: 'invalida' },
    })
  })

  it('descarta un ranking provisional tardío al confirmarse la finalización', async () => {
    let resolverProvisional
    const provisionalPendiente = new Promise((resolver) => (resolverProvisional = resolver))
    dobles.consultarRanking
      .mockReset()
      .mockReturnValueOnce(provisionalPendiente)
      .mockResolvedValueOnce(rankingFinal)
    const wrapper = mount(RankingVista)

    await alActualizar({ partidaId: 42, codigo: 'AB12C', estado: 'FINALIZADA' })
    resolverProvisional({ ...rankingFinal, tipo: 'PROVISIONAL', rondasCompletadas: 4 })
    await flushPromises()

    expect(dobles.consultarRanking).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Clasificación final')
    expect(wrapper.text()).toContain('5 de 5 rondas completadas')
  })
})
