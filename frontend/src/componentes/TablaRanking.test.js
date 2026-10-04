import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TablaRanking from './TablaRanking.vue'

const ranking = {
  tipo: 'FINAL',
  rondasCompletadas: 5,
  totalRondas: 5,
  posiciones: [
    { posicion: 1, jugadorId: 1, nombre: 'María', puntosTotales: 4200, esJugadorActual: true },
    { posicion: 1, jugadorId: 2, nombre: 'Carlos', puntosTotales: 4200, esJugadorActual: false },
    { posicion: 3, jugadorId: 3, nombre: 'Ana', puntosTotales: 3100, esJugadorActual: false },
  ],
}

describe('TablaRanking', () => {
  it('conserva posiciones compartidas e identifica al jugador actual', () => {
    const wrapper = mount(TablaRanking, { props: { ranking } })
    const filas = wrapper.findAll('.posiciones li')

    expect(wrapper.text()).toContain('Clasificación final')
    expect(filas[0].text()).toContain('01')
    expect(filas[1].text()).toContain('01')
    expect(filas[2].text()).toContain('03')
    expect(filas[0].text()).toContain('Tú')
    expect(filas[0].classes()).toContain('posiciones__fila--actual')
  })
})
