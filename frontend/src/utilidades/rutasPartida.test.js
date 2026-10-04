import { describe, expect, it } from 'vitest'

import { redireccionPorSesion, rutaParaEstado } from './rutasPartida'

describe('rutaParaEstado', () => {
  it.each([
    [{ partidaId: 42, estado: 'LOBBY' }, 'lobby'],
    [
      { partidaId: 42, estado: 'RONDA_ACTIVA', ronda: { rondaId: 7 } },
      'ronda',
    ],
    [
      { partidaId: 42, estado: 'RESULTADOS', resultados: { rondaId: 7 } },
      'resultados',
    ],
    [{ partidaId: 42, estado: 'FINALIZADA' }, 'ranking'],
  ])('dirige el estado oficial %s a %s', (estado, nombreRuta) => {
    expect(rutaParaEstado(estado).name).toBe(nombreRuta)
  })
})

describe('redireccionPorSesion', () => {
  it('impide mostrar una partida distinta de la sesión guardada', () => {
    const destino = { meta: { requiereSesion: true }, params: { partidaId: '99' } }

    expect(redireccionPorSesion(destino, { partidaId: 42 })).toEqual({
      name: 'lobby',
      params: { partidaId: 42 },
    })
  })

  it('envía al inicio cuando no existe sesión', () => {
    const destino = { meta: { requiereSesion: true }, params: { partidaId: '42' } }

    expect(redireccionPorSesion(destino, null)).toEqual({ name: 'inicio' })
  })
})
