import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorApi, solicitar } from './clienteHttp'
import {
  consultarEstadoPartida,
  crearPartida,
  esErrorSesionDefinitivo,
  ingresarJugador,
  iniciarPartida,
  recuperarSesion,
} from './servicioPartidas'

vi.mock('./clienteHttp', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, solicitar: vi.fn() }
})

beforeEach(() => {
  solicitar.mockReset()
})

describe('servicioPartidas', () => {
  it('crea una partida mediante el contrato público', async () => {
    solicitar.mockResolvedValue({ partidaId: 42 })

    await crearPartida()

    expect(solicitar).toHaveBeenCalledWith('/partidas', { metodo: 'POST' })
  })

  it('normaliza el código y el nombre al ingresar', async () => {
    solicitar.mockResolvedValue({ partidaId: 42 })

    await ingresarJugador(' ab12c ', '  María  ')

    expect(solicitar).toHaveBeenCalledWith('/partidas/codigo/AB12C/jugadores', {
      metodo: 'POST',
      cuerpo: { nombre: 'María' },
    })
  })

  it('traduce los códigos de negocio a mensajes estables', async () => {
    solicitar.mockRejectedValue(
      new ErrorApi({
        codigo: 'NOMBRE_OCUPADO',
        mensaje: 'Mensaje remoto variable',
        status: 409,
      }),
    )

    await expect(ingresarJugador('AB12C', 'María')).rejects.toThrow(
      'Ese nombre ya está en uso. Elige otro.',
    )
  })

  it('envía la credencial únicamente en las opciones autenticadas', async () => {
    solicitar.mockResolvedValue({ estado: 'LOBBY' })
    const signal = new AbortController().signal

    await recuperarSesion(42, 'token_privado')
    await consultarEstadoPartida(42, 'token_privado', signal)
    await iniciarPartida(42, 'token_privado')

    expect(solicitar).toHaveBeenNthCalledWith(1, '/partidas/42/sesion', {
      token: 'token_privado',
    })
    expect(solicitar).toHaveBeenNthCalledWith(2, '/partidas/42/estado', {
      token: 'token_privado',
      signal,
    })
    expect(solicitar).toHaveBeenNthCalledWith(3, '/partidas/42/iniciar', {
      metodo: 'POST',
      token: 'token_privado',
    })
  })

  it('distingue los errores que invalidan definitivamente la sesión', () => {
    const invalido = new ErrorApi({
      codigo: 'CREDENCIAL_INVALIDA',
      mensaje: 'Inválida',
      status: 401,
    })
    const temporal = new ErrorApi({
      codigo: 'SERVICIO_NO_DISPONIBLE',
      mensaje: 'Temporal',
      status: 503,
    })
    const accesoDenegado = new ErrorApi({
      codigo: 'ACCESO_DENEGADO',
      mensaje: 'Sin permiso',
      status: 403,
    })

    expect(esErrorSesionDefinitivo(invalido)).toBe(true)
    expect(esErrorSesionDefinitivo(temporal)).toBe(false)
    expect(esErrorSesionDefinitivo(accesoDenegado)).toBe(false)
    expect(
      esErrorSesionDefinitivo(accesoDenegado, { accesoDenegadoEsDefinitivo: true }),
    ).toBe(true)
  })
})
