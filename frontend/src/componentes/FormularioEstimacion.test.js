import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormularioEstimacion from './FormularioEstimacion.vue'

describe('FormularioEstimacion', () => {
  it.each(['', '0', '-4', '2.5', 'texto', '9007199254740992'])(
    'rechaza el valor no permitido "%s"',
    async (valor) => {
      const wrapper = mount(FormularioEstimacion, { props: { unidad: 'km' } })

      await wrapper.get('input').setValue(valor)
      await wrapper.get('form').trigger('submit')

      expect(wrapper.emitted('enviar')).toBeUndefined()
      expect(wrapper.get('[role="alert"]').text()).not.toBe('')
    },
  )

  it('emite un entero positivo y conserva el valor escrito', async () => {
    const wrapper = mount(FormularioEstimacion, { props: { unidad: 'km' } })

    await wrapper.get('input').setValue('40000')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('enviar')).toEqual([[40000]])
    expect(wrapper.get('input').element.value).toBe('40000')
  })

  it('reemplaza el formulario por una confirmación definitiva', () => {
    const wrapper = mount(FormularioEstimacion, {
      props: { unidad: 'km', respondio: true, estimacionRegistrada: 40000 },
    })

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Estimación registrada')
    expect(wrapper.get('.estimacion-confirmada').text()).toMatch(/40\s000 km/)
  })

  it('anuncia y enfoca la confirmación después de aceptar la respuesta', async () => {
    const wrapper = mount(FormularioEstimacion, { props: { unidad: 'km' }, attachTo: document.body })

    await wrapper.setProps({ respondio: true, estimacionRegistrada: 40000 })
    await flushPromises()

    const confirmacion = wrapper.get('[role="status"]')
    expect(document.activeElement).toBe(confirmacion.element)
    wrapper.unmount()
  })
})
