import { beforeEach, describe, expect, it } from 'vitest'

import { eliminarSesion, guardarSesion, obtenerSesion } from './servicioSesion'

beforeEach(() => {
  eliminarSesion()
})

describe('servicioSesion', () => {
  it('conserva los datos necesarios para mostrar y recuperar la sesión', () => {
    guardarSesion({ partidaId: 42, rol: 'ANFITRION', token: 'secreto', codigo: 'ABCDE' })

    expect(obtenerSesion()).toEqual({
      partidaId: 42,
      codigo: 'ABCDE',
      rol: 'ANFITRION',
      token: 'secreto',
      persistente: true,
    })
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

  it('conserva temporalmente la sesión si falla el almacenamiento', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('Bloqueado')
    }

    expect(guardarSesion({ partidaId: 42, rol: 'ANFITRION', token: 'secreto' })).toBe(false)
    expect(obtenerSesion()).toEqual({
      partidaId: 42,
      codigo: undefined,
      rol: 'ANFITRION',
      token: 'secreto',
      jugador: undefined,
      persistente: false,
    })
    Storage.prototype.setItem = original
  })
})
