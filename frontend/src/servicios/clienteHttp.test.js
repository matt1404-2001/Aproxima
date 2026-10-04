import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorApi, ErrorComunicacion, solicitar } from './clienteHttp'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('clienteHttp', () => {
  it('serializa JSON y devuelve la respuesta de la API', async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ partidaId: 42 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchSimulado)

    const resultado = await solicitar('/partidas', { metodo: 'POST' })

    expect(resultado).toEqual({ partidaId: 42 })
    expect(fetchSimulado).toHaveBeenCalledOnce()
  })

  it('convierte errores HTTP en ErrorApi', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ codigo: 'NOMBRE_OCUPADO', mensaje: 'Elige otro nombre.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(solicitar('/partidas/codigo/ABCDE/jugadores')).rejects.toMatchObject({
      name: 'ErrorApi',
      codigo: 'NOMBRE_OCUPADO',
      status: 409,
    })
    await expect(Promise.reject(new ErrorApi({ mensaje: 'Error' }))).rejects.toBeInstanceOf(ErrorApi)
  })

  it('distingue una falla de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))

    await expect(solicitar('/salud')).rejects.toBeInstanceOf(ErrorComunicacion)
  })
})
