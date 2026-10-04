<script setup>
defineProps({
  ranking: { type: Object, required: true },
})

const formatearPuntos = (puntos) => puntos.toLocaleString('es-CR')
</script>

<template>
  <section
    class="clasificacion"
    aria-labelledby="titulo-ranking"
  >
    <header class="clasificacion__cabecera">
      <div>
        <h2 id="titulo-ranking">
          {{ ranking.tipo === 'FINAL' ? 'Clasificación final' : 'Clasificación provisional' }}
        </h2>
        <p>{{ ranking.rondasCompletadas }} de {{ ranking.totalRondas }} rondas completadas</p>
      </div>
      <span>{{ ranking.posiciones.length }} jugadores</span>
    </header>

    <ol class="posiciones">
      <li
        v-for="entrada in ranking.posiciones"
        :key="entrada.jugadorId"
        :class="{
          'posiciones__fila--actual': entrada.esJugadorActual,
          'posiciones__fila--lider': ranking.tipo === 'FINAL' && entrada.posicion === 1,
        }"
      >
        <strong class="posicion">{{ String(entrada.posicion).padStart(2, '0') }}</strong>
        <div class="jugador">
          <strong>{{ entrada.nombre }}</strong>
          <small v-if="entrada.esJugadorActual">Tú</small>
        </div>
        <span class="puntos">{{ formatearPuntos(entrada.puntosTotales) }} pts</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.clasificacion {
  min-width: 0;
}

.clasificacion__cabecera {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  border-bottom: 1px solid var(--color-linea-oscura);
  padding-bottom: 1rem;
}

h2,
.clasificacion__cabecera p {
  margin: 0;
}

h2 {
  font-size: clamp(1.6rem, 3vw, 2.35rem);
  letter-spacing: -0.035em;
  line-height: 1;
}

.clasificacion__cabecera p,
.clasificacion__cabecera > span {
  margin-top: 0.65rem;
  color: var(--color-papel-secundario);
  font-size: 0.8rem;
}

.clasificacion__cabecera > span {
  flex: 0 0 auto;
  margin: 0;
}

.posiciones {
  margin: 0;
  padding: 0;
  list-style: none;
}

.posiciones li {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  min-height: 4.4rem;
  border-bottom: 1px solid var(--color-linea-oscura);
  padding: 0.75rem;
}

.posicion {
  color: var(--color-papel-secundario);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.jugador {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.jugador strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jugador small {
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
  background: var(--color-acento);
  color: var(--color-tinta);
  font-size: 0.68rem;
  font-weight: 760;
  text-transform: uppercase;
}

.puntos {
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  font-weight: 720;
  white-space: nowrap;
}

.posiciones__fila--actual {
  background: var(--color-tinta-elevada);
}

.posiciones__fila--lider .posicion,
.posiciones__fila--lider .puntos {
  color: var(--color-acento);
}

@media (max-width: 520px) {
  .clasificacion__cabecera {
    align-items: start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .posiciones li {
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    gap: 0.65rem;
    padding-inline: 0.25rem;
  }
}
</style>
