import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useContadorRonda } from './useContadorRonda'

const ahora = new Date('2026-10-03T16:02:05Z')

function montarContador(latencia = 0) {
  const ronda = ref({ finalizaEn: '2026-10-03T16:02:30Z' })
  const servidorAhora = ref('2026-10-03T16:02:05Z')
  const latenciaEstimadaMs = ref(latencia)
  const Componente = defineComponent({
    setup() {
      return {
        ...useContadorRonda(ronda, servidorAhora, latenciaEstimadaMs),
        ronda,
        servidorAhora,
      }
    },
    template: '<p>{{ segundosRestantes }}</p>',
  })

  return { wrapper: mount(Componente), ronda, servidorAhora }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(ahora)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useContadorRonda', () => {
  it('calcula el tiempo con el reloj oficial y nunca baja de cero', async () => {
    const { wrapper } = montarContador()

    expect(wrapper.text()).toBe('25')
    await vi.advanceTimersByTimeAsync(25000)
    expect(wrapper.text()).toBe('0')
    await vi.advanceTimersByTimeAsync(3000)
    expect(wrapper.text()).toBe('0')

    wrapper.unmount()
  })

  it('resincroniza el contador cuando llega un nuevo estado', async () => {
    const { wrapper, ronda, servidorAhora } = montarContador()
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).toBe('20')

    ronda.value = { finalizaEn: '2026-10-03T16:02:30Z' }
    servidorAhora.value = '2026-10-03T16:02:20Z'
    await nextTick()

    expect(wrapper.text()).toBe('10')
    wrapper.unmount()
  })

  it('descuenta la latencia estimada de la respuesta', () => {
    const { wrapper } = montarContador(1200)

    expect(wrapper.text()).toBe('24')
    wrapper.unmount()
  })
})
