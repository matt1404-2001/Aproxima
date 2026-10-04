<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useEstadoPartida } from '../composables/useEstadoPartida'
import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'
import { rutaConEstado, rutaParaEstado } from '../utilidades/rutasPartida'

const router = useRouter()
const route = useRoute()
const sesion = obtenerSesion()
const estadoInicial = window.history.state?.estadoPartida || null
const sesionRecuperada = Boolean(window.history.state?.sesionRecuperada)

const {
  estadoPartida: estadoConsultado,
  desconectado,
  sesionInvalida,
  reintentar,
} = useEstadoPartida(sesion, { alActualizar: redirigirSiCambio })

const estadoPartida = computed(() => estadoConsultado.value || estadoInicial)
const titulo = computed(() => {
  if (estadoPartida.value?.estado === 'RONDA_ACTIVA') return 'La ronda está en curso'
  if (estadoPartida.value?.estado === 'RESULTADOS') return 'Resultados disponibles'
  return 'La partida ha finalizado'
})
const detalle = computed(() => {
  if (estadoPartida.value?.estado === 'RONDA_ACTIVA') {
    const ronda = estadoPartida.value.ronda
    return `Ronda ${ronda.numero} de ${ronda.totalRondas}: ${ronda.enunciado}`
  }
  if (estadoPartida.value?.estado === 'RESULTADOS') {
    return `La ronda ${estadoPartida.value.resultados.numero} terminó. El servidor está listo para mostrar sus resultados.`
  }
  return 'El ranking final está disponible para todos los participantes.'
})

watch(sesionInvalida, async (esInvalida) => {
  if (!esInvalida) return
  eliminarSesion()
  await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
})

async function redirigirSiCambio(nuevoEstado) {
  const destino = rutaParaEstado(nuevoEstado)
  if (router.resolve(destino).fullPath === route.fullPath) return
  await router.replace(rutaConEstado(nuevoEstado))
}

async function salir() {
  eliminarSesion()
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main class="estado-partida">
    <header class="barra">
      <div class="marca">
        <span aria-hidden="true" /> Estimate Arena
      </div>
      <button
        class="salir"
        type="button"
        @click="salir"
      >
        Salir
      </button>
    </header>

    <section
      class="contenido"
      aria-labelledby="titulo-estado"
    >
      <p class="codigo">
        Partida {{ estadoPartida?.codigo || '-----' }}
      </p>
      <p
        v-if="sesionRecuperada"
        class="sesion-recuperada"
        role="status"
      >
        Sesión recuperada correctamente
      </p>
      <h1 id="titulo-estado">
        {{ titulo }}
      </h1>
      <p class="detalle">
        {{ detalle }}
      </p>

      <div
        v-if="estadoPartida?.estado === 'RONDA_ACTIVA'"
        class="medicion"
      >
        <span>Unidad de respuesta</span>
        <strong>{{ estadoPartida.ronda.unidad }}</strong>
      </div>

      <div
        v-if="desconectado"
        class="conexion"
        role="status"
      >
        <p>Se perdió la conexión. Tu sesión sigue guardada.</p>
        <button
          class="boton boton--acento"
          type="button"
          @click="reintentar"
        >
          Reintentar ahora
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.estado-partida {
  min-height: 100dvh;
  padding: clamp(1.25rem, 3vw, 3rem);
  background: var(--color-tinta);
  color: var(--color-papel);
}

.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.marca span {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-acento);
}

.salir {
  border: 0;
  padding: 0.7rem;
  background: transparent;
  color: var(--color-papel-secundario);
  font-weight: 650;
  cursor: pointer;
}

.contenido {
  width: min(100%, 72rem);
  margin: clamp(5rem, 14vh, 10rem) auto 0;
}

.codigo {
  color: var(--color-acento);
  font-size: 0.82rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sesion-recuperada {
  margin: 0.75rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 0.88rem;
}

h1 {
  max-width: 12ch;
  margin: 1rem 0 0;
  font-size: clamp(3.4rem, 9vw, 6rem);
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-wrap: balance;
}

.detalle {
  max-width: 50rem;
  margin: 1.75rem 0 0;
  color: var(--color-papel-secundario);
  font-size: clamp(1rem, 2vw, 1.35rem);
  line-height: 1.55;
}

.medicion {
  display: grid;
  gap: 0.5rem;
  margin-top: clamp(3rem, 9vh, 7rem);
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1.25rem;
}

.medicion span {
  color: var(--color-papel-secundario);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.medicion strong {
  color: var(--color-acento);
  font-size: clamp(3rem, 9vw, 6rem);
  line-height: 1;
}

.conexion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 3rem;
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
}

.conexion p {
  margin: 0;
  color: var(--color-papel-secundario);
}

.boton--acento {
  background: var(--color-acento);
  color: var(--color-tinta);
}

@media (max-width: 600px) {
  .conexion {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
