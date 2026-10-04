import { beforeEach, describe, expect, it } from 'vitest'

import { eliminarSesion, guardarSesion, obtenerSesion } from './servicioSesion'

beforeEach(() => {
  localStorage.clear()
})

describe('servicioSesion', () => {
  it('conserva únicamente los datos privados necesarios', () => {
    guardarSesion({ partidaId: 42, rol: 'ANFITRION', token: 'secreto', codigo: 'ABCDE' })

    expect(obtenerSesion()).toEqual({ partidaId: 42, rol: 'ANFITRION', token: 'secreto' })
  })

  it('elimina una sesión incompleta', () => {
    localStorage.setItem('estimate-arena:sesion', JSON.stringify({ partidaId: 42 }))

    expect(obtenerSesion()).toBeNull()
    expect(localStorage.getItem('estimate-arena:sesion')).toBeNull()
  })

  it('elimina la sesión bajo solicitud', () => {
    guardarSesion({ partidaId: 42, rol: 'JUGADOR', token: 'secreto' })

    eliminarSesion()

    expect(obtenerSesion()).toBeNull()
  })
})
