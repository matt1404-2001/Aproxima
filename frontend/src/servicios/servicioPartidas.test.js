import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorApi, solicitar } from './clienteHttp'
import { crearPartida, ingresarJugador } from './servicioPartidas'

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
})
