import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormularioIngreso from './FormularioIngreso.vue'

describe('FormularioIngreso', () => {
  it('muestra validaciones antes de emitir', async () => {
    const wrapper = mount(FormularioIngreso)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Escribe el código de la partida.')
    expect(wrapper.text()).toContain('Escribe el nombre que usarás en la partida.')
    expect(wrapper.emitted('enviar')).toBeUndefined()
  })

  it('normaliza y emite datos válidos', async () => {
    const wrapper = mount(FormularioIngreso)

    await wrapper.get('#codigo-partida').setValue('ab12c')
    await wrapper.get('#nombre-jugador').setValue('  María  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('enviar')).toEqual([[{ codigo: 'AB12C', nombre: 'María' }]])
  })

  it('bloquea acciones y comunica el estado pendiente', () => {
    const wrapper = mount(FormularioIngreso, { props: { pendiente: true } })

    expect(wrapper.get('form').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Ingresando…')
  })
})
