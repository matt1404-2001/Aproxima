import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useEstadoPartida } from './useEstadoPartida'

const dobles = vi.hoisted(() => ({
  consultar: vi.fn(),
  esDefinitivo: vi.fn(),
}))

vi.mock('../servicios/servicioPartidas', () => ({
  consultarEstadoPartida: dobles.consultar,
  esErrorSesionDefinitivo: dobles.esDefinitivo,
}))

const ComponentePrueba = defineComponent({
  setup() {
    return useEstadoPartida({ partidaId: 42, token: 'privado' })
  },
  template: '<p>{{ estadoPartida?.versionEstado }} {{ desconectado }} {{ sesionInvalida }}</p>',
})

beforeEach(() => {
  vi.useFakeTimers()
  dobles.consultar.mockReset()
  dobles.esDefinitivo.mockReset().mockReturnValue(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEstadoPartida', () => {
  it('consulta sin solaparse y respeta el intervalo sugerido', async () => {
    dobles.consultar
      .mockResolvedValueOnce({ versionEstado: 1, pollingSugeridoMs: 1200 })
      .mockResolvedValueOnce({ versionEstado: 2, pollingSugeridoMs: 1200 })
    const wrapper = mount(ComponentePrueba)
    await flushPromises()

    expect(dobles.consultar).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1199)
    expect(dobles.consultar).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    expect(dobles.consultar).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('2 false')

    wrapper.unmount()
  })

  it('conserva la sesión y reintenta después de un error temporal', async () => {
    dobles.consultar
      .mockRejectedValueOnce(new Error('Sin red'))
      .mockResolvedValueOnce({ versionEstado: 1, pollingSugeridoMs: 2000 })
    const wrapper = mount(ComponentePrueba)
    await flushPromises()

    expect(wrapper.text()).toContain('true')

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(wrapper.text()).toContain('1 false')

    wrapper.unmount()
  })

  it('cancela la solicitud al desmontar la vista', async () => {
    let signal
    dobles.consultar.mockImplementation((_partidaId, _token, recibido) => {
      signal = recibido
      return new Promise(() => {})
    })
    const wrapper = mount(ComponentePrueba)
    await flushPromises()

    wrapper.unmount()

    expect(signal.aborted).toBe(true)
  })

  it('ignora una respuesta con una versión anterior', async () => {
    dobles.consultar
      .mockResolvedValueOnce({ versionEstado: 3, pollingSugeridoMs: 1000 })
      .mockResolvedValueOnce({ versionEstado: 2, pollingSugeridoMs: 1000 })
    const wrapper = mount(ComponentePrueba)
    await flushPromises()

    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(wrapper.text()).toContain('3 false false')
    wrapper.unmount()
  })

  it('detiene el polling cuando la sesión deja de ser válida', async () => {
    dobles.consultar.mockRejectedValue(new Error('Credencial inválida'))
    dobles.esDefinitivo.mockReturnValue(true)
    const wrapper = mount(ComponentePrueba)
    await flushPromises()

    expect(wrapper.text()).toContain('false true')
    await vi.advanceTimersByTimeAsync(5000)
    expect(dobles.consultar).toHaveBeenCalledOnce()

    wrapper.unmount()
  })
})
