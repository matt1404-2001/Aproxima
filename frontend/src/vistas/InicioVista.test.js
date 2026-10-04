import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InicioVista from './InicioVista.vue'

const dobles = vi.hoisted(() => ({
  push: vi.fn(),
  crearPartida: vi.fn(),
  ingresarJugador: vi.fn(),
  almacenamientoDisponible: vi.fn(),
  guardarSesion: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: dobles.push }),
}))

vi.mock('../servicios/servicioPartidas', () => ({
  crearPartida: dobles.crearPartida,
  ingresarJugador: dobles.ingresarJugador,
}))

vi.mock('../servicios/servicioSesion', () => ({
  almacenamientoDisponible: dobles.almacenamientoDisponible,
  guardarSesion: dobles.guardarSesion,
}))

beforeEach(() => {
  vi.clearAllMocks()
  dobles.almacenamientoDisponible.mockReturnValue(true)
  dobles.guardarSesion.mockReturnValue(true)
})

describe('InicioVista', () => {
  it('crea la partida, conserva la credencial y abre el lobby', async () => {
    dobles.crearPartida.mockResolvedValue({
      partidaId: 42,
      codigo: 'AB12C',
      tokenAnfitrion: 'hst_secreto',
    })
    const wrapper = mount(InicioVista)

    await wrapper.get('.boton--principal').trigger('click')
    await flushPromises()

    expect(dobles.crearPartida).toHaveBeenCalledOnce()
    expect(dobles.guardarSesion).toHaveBeenCalledWith({
      partidaId: 42,
      codigo: 'AB12C',
      rol: 'ANFITRION',
      token: 'hst_secreto',
    })
    expect(dobles.push).toHaveBeenCalledWith({
      name: 'lobby',
      params: { partidaId: 42 },
    })
  })

  it('no crea una partida cuando no puede conservar la credencial', async () => {
    dobles.almacenamientoDisponible.mockReturnValue(false)
    const wrapper = mount(InicioVista)

    await wrapper.get('.boton--principal').trigger('click')

    expect(dobles.crearPartida).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('almacenamiento local')
  })

  it('ingresa con datos normalizados y conserva la sesión del jugador', async () => {
    dobles.ingresarJugador.mockResolvedValue({
      partidaId: 42,
      codigo: 'AB12C',
      jugador: { jugadorId: 8, nombre: 'María' },
      tokenJugador: 'ply_secreto',
    })
    const wrapper = mount(InicioVista)

    await wrapper.get('.boton--secundario').trigger('click')
    await wrapper.get('#codigo-partida').setValue('ab12c')
    await wrapper.get('#nombre-jugador').setValue('  María  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(dobles.ingresarJugador).toHaveBeenCalledWith('AB12C', 'María')
    expect(dobles.guardarSesion).toHaveBeenCalledWith({
      partidaId: 42,
      codigo: 'AB12C',
      rol: 'JUGADOR',
      token: 'ply_secreto',
      jugador: { jugadorId: 8, nombre: 'María' },
    })
  })
})
