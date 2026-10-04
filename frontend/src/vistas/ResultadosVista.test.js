import { flushPromises, mount } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ResultadosVista from './ResultadosVista.vue'

const dobles = vi.hoisted(() => ({
  replace: vi.fn(),
  resolve: vi.fn(() => ({ fullPath: '/partida/42/ronda/17/resultados' })),
  useEstadoPartida: vi.fn(),
  consultarResultados: vi.fn(),
  consultarRanking: vi.fn(),
  avanzar: vi.fn(),
  finalizar: vi.fn(),
  esDefinitivo: vi.fn(),
  eliminarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  reintentar: vi.fn(),
  detener: vi.fn(),
}))

let alActualizar
let estadoActual

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/partida/42/ronda/17/resultados' }),
  useRouter: () => ({ replace: dobles.replace, resolve: dobles.resolve }),
}))

vi.mock('../composables/useEstadoPartida', () => ({
  useEstadoPartida: dobles.useEstadoPartida,
}))

vi.mock('../servicios/servicioPartidas', () => ({
  consultarResultadosRonda: dobles.consultarResultados,
  consultarRanking: dobles.consultarRanking,
  avanzarRonda: dobles.avanzar,
  finalizarPartida: dobles.finalizar,
  esErrorSesionDefinitivo: dobles.esDefinitivo,
}))

vi.mock('../servicios/servicioSesion', () => ({
  eliminarSesion: dobles.eliminarSesion,
  obtenerSesion: dobles.obtenerSesion,
}))

function estadoResultados(rol = 'JUGADOR', numero = 1) {
  return {
    partidaId: 42,
    codigo: 'AB12C',
    estado: 'RESULTADOS',
    versionEstado: 6,
    rol,
    pollingSugeridoMs: 2000,
    resultados: {
      rondaId: 17,
      numero,
      resultadosDisponibles: true,
      puedeAvanzar: rol === 'ANFITRION' && numero < 5,
      puedeFinalizar: rol === 'ANFITRION' && numero === 5,
    },
  }
}

function datosResultados({ respondio = true, hayRespuestas = true } = {}) {
  return {
    partidaId: 42,
    rondaId: 17,
    numero: 1,
    totalRondas: 5,
    enunciado: '¿Cuánto mide la circunferencia de la Tierra?',
    unidad: 'km',
    respuestaCorrecta: 40075,
    motivoCierre: 'TODOS_RESPONDIERON',
    cerradaEn: '2026-10-03T16:02:30Z',
    estadisticas: {
      hayRespuestas,
      cantidadRespuestas: hayRespuestas ? 2 : 0,
      totalJugadores: 2,
      estimacionMinima: hayRespuestas ? 35000 : null,
      promedio: hayRespuestas ? 37500 : null,
      estimacionMaxima: hayRespuestas ? 40000 : null,
    },
    resultadoPersonal: {
      respondio,
      estimacion: respondio ? 35000 : null,
      diferenciaAbsoluta: respondio ? 5075 : null,
      puntos: respondio ? 873 : 0,
    },
    explicacion: 'Valor aproximado del ecuador.',
    fuente: 'https://example.com/fuente',
    servidorAhora: '2026-10-03T16:02:31Z',
  }
}

function datosRanking(tipo = 'PROVISIONAL') {
  return {
    partidaId: 42,
    tipo,
    rondasCompletadas: tipo === 'FINAL' ? 5 : 1,
    totalRondas: 5,
    posiciones: [
      { posicion: 1, jugadorId: 8, nombre: 'María', puntosTotales: 873, esJugadorActual: true },
      { posicion: 2, jugadorId: 9, nombre: 'Carlos', puntosTotales: 700, esJugadorActual: false },
    ],
    servidorAhora: '2026-10-03T16:02:31Z',
  }
}

function configurarEstado(estado = estadoResultados()) {
  dobles.useEstadoPartida.mockImplementation((_sesion, opciones) => {
    alActualizar = opciones.alActualizar
    estadoActual = shallowRef(estado)
    return {
      estadoPartida: estadoActual,
      desconectado: ref(false),
      sesionInvalida: ref(false),
      reintentar: dobles.reintentar,
      detener: dobles.detener,
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  window.history.replaceState({}, '')
  dobles.obtenerSesion.mockReturnValue({
    partidaId: 42,
    codigo: 'AB12C',
    rol: 'JUGADOR',
    token: 'privado',
    jugador: { jugadorId: 8, nombre: 'María' },
  })
  dobles.esDefinitivo.mockReturnValue(false)
  dobles.consultarResultados.mockResolvedValue(datosResultados())
  dobles.consultarRanking.mockResolvedValue(datosRanking())
  configurarEstado()
})

describe('ResultadosVista', () => {
  it('muestra respuesta, resultado personal, estadísticas y ranking oficial', async () => {
    const wrapper = mount(ResultadosVista)
    await flushPromises()

    expect(wrapper.text()).toContain('40 075')
    expect(wrapper.text()).toContain('Estimaste 35 000 km')
    expect(wrapper.text()).toContain('873')
    expect(wrapper.text()).toContain('2 de 2 jugadores')
    expect(wrapper.text()).toContain('Clasificación provisional')
    expect(wrapper.text()).toContain('terminó anticipadamente')
    expect(wrapper.find('.control-anfitrion').exists()).toBe(false)
  })

  it('presenta el estado sin respuestas sin inventar estadísticas', async () => {
    dobles.consultarResultados.mockResolvedValue(datosResultados({ respondio: false, hayRespuestas: false }))
    const wrapper = mount(ResultadosVista)
    await flushPromises()

    expect(wrapper.text()).toContain('No enviaste una estimación')
    expect(wrapper.text()).toContain('Ningún jugador respondió esta ronda')
    expect(wrapper.find('.estadisticas dl').exists()).toBe(false)
  })

  it('permite al anfitrión avanzar una sola vez con la transición oficial', async () => {
    dobles.obtenerSesion.mockReturnValue({ partidaId: 42, codigo: 'AB12C', rol: 'ANFITRION', token: 'privado' })
    configurarEstado(estadoResultados('ANFITRION'))
    const siguiente = {
      partidaId: 42,
      estado: 'RONDA_ACTIVA',
      ronda: { rondaId: 18 },
    }
    dobles.avanzar.mockResolvedValue({ estadoPartida: siguiente })
    const wrapper = mount(ResultadosVista)
    await flushPromises()

    await wrapper.get('.boton--accion').trigger('click')
    await flushPromises()

    expect(dobles.avanzar).toHaveBeenCalledOnce()
    expect(dobles.avanzar).toHaveBeenCalledWith(42, 17, 'privado', expect.any(AbortSignal))
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'ronda',
      params: { partidaId: 42, rondaId: 18 },
      state: { estadoPartida: siguiente },
    })
  })

  it('exige confirmación antes de finalizar y navega con el ranking devuelto', async () => {
    dobles.obtenerSesion.mockReturnValue({ partidaId: 42, codigo: 'AB12C', rol: 'ANFITRION', token: 'privado' })
    configurarEstado(estadoResultados('ANFITRION', 5))
    const rankingFinal = datosRanking('FINAL')
    dobles.finalizar.mockResolvedValue({ estado: 'FINALIZADA', ranking: rankingFinal })
    const wrapper = mount(ResultadosVista, { attachTo: document.body })
    await flushPromises()

    await wrapper.get('.boton--accion').trigger('click')
    expect(dobles.finalizar).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('¿Finalizar la partida?')
    expect(document.activeElement).toBe(wrapper.get('.confirmacion-final').element)

    await wrapper.get('.cancelar').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('.boton--accion').element)
    await wrapper.get('.boton--accion').trigger('click')

    await wrapper.get('.boton--accion').trigger('click')
    await flushPromises()

    expect(dobles.finalizar).toHaveBeenCalledWith(42, 17, 'privado', expect.any(AbortSignal))
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'ranking',
      params: { partidaId: 42 },
      state: { rankingFinal },
    })
    wrapper.unmount()
  })

  it('redirige cuando el polling detecta otro estado', async () => {
    mount(ResultadosVista)
    const siguiente = { partidaId: 42, estado: 'RONDA_ACTIVA', ronda: { rondaId: 18 } }
    dobles.resolve.mockReturnValueOnce({ fullPath: '/partida/42/ronda/18' })

    await alActualizar(siguiente)

    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'ronda',
      params: { partidaId: 42, rondaId: 18 },
      state: { estadoPartida: siguiente },
    })
  })

  it('recarga los datos al corregir una URL de resultados desactualizada', async () => {
    const nuevosResultados = datosResultados()
    nuevosResultados.rondaId = 18
    nuevosResultados.numero = 2
    nuevosResultados.enunciado = '¿Cuántos litros caben en una piscina olímpica?'
    dobles.consultarResultados
      .mockReset()
      .mockResolvedValueOnce(datosResultados())
      .mockResolvedValueOnce(nuevosResultados)
    const wrapper = mount(ResultadosVista)
    await flushPromises()

    const nuevoEstado = estadoResultados('JUGADOR', 2)
    nuevoEstado.resultados.rondaId = 18
    estadoActual.value = nuevoEstado
    dobles.resolve.mockReturnValueOnce({ fullPath: '/partida/42/ronda/18/resultados' })
    await alActualizar(nuevoEstado)
    await flushPromises()

    expect(dobles.detener).not.toHaveBeenCalled()
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'resultados',
      params: { partidaId: 42, rondaId: 18 },
      state: { estadoPartida: nuevoEstado },
    })
    expect(wrapper.text()).toContain('piscina olímpica')
  })

  it('mantiene el estado de preparación cuando los resultados aún no están disponibles', async () => {
    const error = Object.assign(new Error('Los resultados todavía están siendo preparados.'), {
      codigo: 'RESULTADOS_NO_DISPONIBLES',
    })
    dobles.consultarResultados.mockRejectedValue(error)
    const estado = estadoResultados()
    estado.resultados.resultadosDisponibles = false
    configurarEstado(estado)
    const wrapper = mount(ResultadosVista)
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Preparando resultados…')
    expect(wrapper.text()).toContain('todavía están siendo preparados')
    expect(wrapper.text()).not.toContain('Resultados disponibles')
  })
})
