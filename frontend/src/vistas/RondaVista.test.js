import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, ref, shallowRef } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RondaVista from './RondaVista.vue'

const dobles = vi.hoisted(() => ({
  replace: vi.fn(),
  resolve: vi.fn(() => ({ fullPath: '/partida/42/ronda/17' })),
  useEstadoPartida: vi.fn(),
  enviarEstimacion: vi.fn(),
  esErrorSesionDefinitivo: vi.fn(),
  eliminarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  reintentar: vi.fn(),
  detener: vi.fn(),
}))

let alActualizar
let segundosRestantes
let estadoActual

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/partida/42/ronda/17' }),
  useRouter: () => ({ replace: dobles.replace, resolve: dobles.resolve }),
}))

vi.mock('../composables/useEstadoPartida', () => ({
  useEstadoPartida: dobles.useEstadoPartida,
}))

vi.mock('../composables/useContadorRonda', () => ({
  useContadorRonda: () => ({ segundosRestantes }),
}))

vi.mock('../servicios/servicioPartidas', () => ({
  enviarEstimacion: dobles.enviarEstimacion,
  esErrorSesionDefinitivo: dobles.esErrorSesionDefinitivo,
}))

vi.mock('../servicios/servicioSesion', () => ({
  eliminarSesion: dobles.eliminarSesion,
  obtenerSesion: dobles.obtenerSesion,
}))

function estadoRonda(rol = 'JUGADOR', participacion = { respondio: false }) {
  return {
    partidaId: 42,
    codigo: 'AB12C',
    estado: 'RONDA_ACTIVA',
    versionEstado: 5,
    servidorAhora: '2026-10-03T16:02:05Z',
    rol,
    ronda: {
      rondaId: 17,
      numero: 1,
      totalRondas: 5,
      enunciado: '¿Cuánto mide la circunferencia de la Tierra?',
      unidad: 'km',
      iniciadaEn: '2026-10-03T16:02:00Z',
      finalizaEn: '2026-10-03T16:02:30Z',
      participacion: rol === 'JUGADOR' ? participacion : null,
    },
  }
}

function configurarEstado(estado = estadoRonda()) {
  dobles.useEstadoPartida.mockImplementation((_sesion, opciones) => {
    alActualizar = opciones.alActualizar
    estadoActual = shallowRef(estado)
    return {
      estadoPartida: estadoActual,
    cargando: ref(false),
    desconectado: ref(false),
    sesionInvalida: ref(false),
    latenciaEstimadaMs: ref(0),
    reintentar: dobles.reintentar,
    detener: dobles.detener,
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  segundosRestantes = ref(24)
  window.history.replaceState({}, '')
  dobles.obtenerSesion.mockReturnValue({
    partidaId: 42,
    codigo: 'AB12C',
    rol: 'JUGADOR',
    token: 'privado',
    jugador: { jugadorId: 8, nombre: 'María' },
  })
  dobles.esErrorSesionDefinitivo.mockReturnValue(false)
  configurarEstado()
})

describe('RondaVista', () => {
  it('muestra el desafío, la unidad y el formulario sin revelar una respuesta', () => {
    const wrapper = mount(RondaVista)

    expect(wrapper.text()).toContain('Ronda 1 de 5')
    expect(wrapper.text()).toContain('¿Cuánto mide la circunferencia de la Tierra?')
    expect(wrapper.text()).toContain('24')
    expect(wrapper.get('label').text()).toContain('km')
    expect(wrapper.text()).not.toContain('respuesta correcta')
  })

  it('envía una sola estimación y muestra la confirmación del servidor', async () => {
    dobles.enviarEstimacion.mockResolvedValue({
      estimacionId: 300,
      partidaId: 42,
      rondaId: 17,
      valor: 40000,
      recibidaEn: '2026-10-03T16:02:18Z',
      estadoPartida: 'RONDA_ACTIVA',
      mensaje: 'Tu estimación fue registrada correctamente.',
    })
    const wrapper = mount(RondaVista)

    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(dobles.enviarEstimacion).toHaveBeenCalledOnce()
    expect(dobles.enviarEstimacion).toHaveBeenCalledWith(
      42,
      17,
      'privado',
      40000,
      expect.any(AbortSignal),
    )
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Estimación registrada')
    expect(dobles.reintentar).toHaveBeenCalled()
  })

  it('ignora envíos repetidos mientras registra la respuesta', async () => {
    dobles.enviarEstimacion.mockReturnValue(new Promise(() => {}))
    const wrapper = mount(RondaVista)

    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')

    expect(dobles.enviarEstimacion).toHaveBeenCalledOnce()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('mantiene bloqueada una respuesta recuperada desde el servidor', () => {
    configurarEstado(estadoRonda('JUGADOR', { respondio: true, estimacion: 39500 }))
    const wrapper = mount(RondaVista)

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.get('.estimacion-confirmada').text()).toMatch(/39\s500 km/)
  })

  it('no permite que el anfitrión envíe estimaciones', () => {
    dobles.obtenerSesion.mockReturnValue({ partidaId: 42, rol: 'ANFITRION', token: 'privado' })
    configurarEstado(estadoRonda('ANFITRION'))
    const wrapper = mount(RondaVista)

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('La ronda está abierta')
  })

  it('bloquea el formulario si el servidor confirma una estimación duplicada', async () => {
    const error = Object.assign(new Error('Ya enviaste una estimación para esta ronda.'), {
      codigo: 'ESTIMACION_DUPLICADA',
    })
    dobles.enviarEstimacion.mockRejectedValue(error)
    const wrapper = mount(RondaVista)

    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Estimación registrada')
    expect(dobles.reintentar).toHaveBeenCalled()
    expect(dobles.eliminarSesion).not.toHaveBeenCalled()
  })

  it('mantiene el polling al navegar a otra ronda activa', async () => {
    mount(RondaVista)
    const siguienteRonda = estadoRonda()
    siguienteRonda.ronda.rondaId = 18
    siguienteRonda.ronda.numero = 2
    dobles.resolve.mockReturnValueOnce({ fullPath: '/partida/42/ronda/18' })

    await alActualizar(siguienteRonda)

    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'ronda',
      params: { partidaId: 42, rondaId: 18 },
      state: { estadoPartida: siguienteRonda },
    })
    expect(dobles.detener).not.toHaveBeenCalled()
  })

  it('vuelve a habilitar el formulario si el servidor confirma tiempo disponible', async () => {
    segundosRestantes.value = 0
    const wrapper = mount(RondaVista)
    await nextTick()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()

    segundosRestantes.value = 8
    await nextTick()

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('descarta la respuesta tardía de una ronda anterior', async () => {
    let resolverEnvio
    dobles.enviarEstimacion.mockReturnValue(new Promise((resolver) => (resolverEnvio = resolver)))
    const wrapper = mount(RondaVista)
    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')

    const siguienteRonda = estadoRonda()
    siguienteRonda.ronda.rondaId = 18
    siguienteRonda.ronda.numero = 2
    estadoActual.value = siguienteRonda
    await nextTick()
    resolverEnvio({ valor: 40000, rondaId: 17 })
    await flushPromises()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Estimación registrada')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('distingue una ronda desactualizada de un tiempo finalizado', async () => {
    dobles.enviarEstimacion.mockRejectedValue(
      Object.assign(new Error('La ronda cambió. Actualizando la información.'), {
        codigo: 'RONDA_NO_VIGENTE',
      }),
    )
    const wrapper = mount(RondaVista)
    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('button[type="submit"]').text()).toBe('Actualizando ronda')
    expect(dobles.reintentar).toHaveBeenCalled()
  })

  it('elimina una sesión definitivamente inválida', async () => {
    dobles.esErrorSesionDefinitivo.mockReturnValue(true)
    dobles.enviarEstimacion.mockRejectedValue(new Error('Credencial inválida'))
    const wrapper = mount(RondaVista)
    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(dobles.eliminarSesion).toHaveBeenCalled()
    expect(dobles.replace).toHaveBeenCalledWith({
      name: 'inicio',
      query: { sesion: 'invalida' },
    })
  })
})
