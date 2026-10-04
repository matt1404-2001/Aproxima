<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import TablaRanking from '../componentes/TablaRanking.vue'
import { useEstadoPartida } from '../composables/useEstadoPartida'
import { consultarRanking, esErrorSesionDefinitivo } from '../servicios/servicioPartidas'
import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'
import { rutaConEstado } from '../utilidades/rutasPartida'

const router = useRouter()
const sesion = obtenerSesion()
const ranking = ref(window.history.state?.rankingFinal || null)
const cargando = ref(!ranking.value)
const errorRanking = ref('')
let controladorRanking = null

const {
  estadoPartida,
  desconectado,
  sesionInvalida,
  reintentar,
  detener,
} = useEstadoPartida(sesion, { alActualizar: confirmarFinalizacion })

const codigo = computed(() => estadoPartida.value?.codigo || sesion?.codigo || '-----')

watch(sesionInvalida, async (esInvalida) => {
  if (!esInvalida) return
  eliminarSesion()
  await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
})

onMounted(cargarRanking)
onUnmounted(() => controladorRanking?.abort())

async function confirmarFinalizacion(nuevoEstado) {
  if (nuevoEstado.estado === 'FINALIZADA') {
    detener()
    controladorRanking?.abort()
    controladorRanking = null
    if (ranking.value?.tipo !== 'FINAL') {
      ranking.value = null
      cargarRanking()
    }
    return
  }

  controladorRanking?.abort()
  await router.replace(rutaConEstado(nuevoEstado))
}

async function cargarRanking() {
  if (controladorRanking) return
  const controlador = new AbortController()
  controladorRanking = controlador
  cargando.value = !ranking.value
  errorRanking.value = ''

  try {
    const respuesta = await consultarRanking(sesion.partidaId, sesion.token, controlador.signal)
    if (controladorRanking !== controlador || controlador.signal.aborted) return
    ranking.value = respuesta
  } catch (error) {
    if (error?.name === 'AbortError') return
    if (esErrorSesionDefinitivo(error)) {
      eliminarSesion()
      await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
      return
    }
    errorRanking.value = error.message || 'No fue posible obtener la clasificación final.'
  } finally {
    if (controladorRanking === controlador) {
      controladorRanking = null
      cargando.value = false
    }
  }
}

async function volverAlInicio() {
  controladorRanking?.abort()
  detener()
  eliminarSesion()
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main class="ranking-vista">
    <header class="barra">
      <div class="marca">
        <span aria-hidden="true" /> Estimate Arena
      </div>
      <div class="barra__partida">
        Partida {{ codigo }}
      </div>
      <button
        class="salir"
        type="button"
        @click="volverAlInicio"
      >
        Salir
      </button>
    </header>

    <div class="ranking-final">
      <section
        class="cierre"
        aria-labelledby="titulo-final"
      >
        <p>Partida finalizada</p>
        <h1 id="titulo-final">
          La arena tiene su clasificación.
        </h1>
        <p class="cierre__detalle">
          Cinco rondas, una tabla definitiva. Los empates comparten la misma posición.
        </p>
        <button
          class="boton boton--nueva"
          type="button"
          @click="volverAlInicio"
        >
          Crear otra partida
        </button>
      </section>

      <section
        class="tabla-final"
        aria-live="polite"
      >
        <TablaRanking
          v-if="ranking"
          :ranking="ranking"
        />
        <p
          v-else-if="cargando"
          class="estado-ranking"
        >
          Preparando la clasificación final…
        </p>
        <div
          v-if="errorRanking"
          class="error-ranking"
          role="alert"
        >
          <p>{{ errorRanking }}</p>
          <button
            type="button"
            @click="cargarRanking"
          >
            Reintentar
          </button>
        </div>
        <div
          v-if="desconectado"
          class="conexion"
          role="status"
        >
          <p>Se perdió la conexión. La clasificación visible se conservará.</p>
          <button
            type="button"
            @click="reintentar"
          >
            Comprobar estado
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.ranking-vista {
  min-height: 100dvh;
  padding: clamp(1rem, 2.5vw, 2.5rem);
  background: var(--color-tinta);
  color: var(--color-papel);
}

.barra {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.82rem;
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

.barra__partida {
  color: var(--color-papel-secundario);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.salir {
  justify-self: end;
  border: 0;
  padding: 0.7rem;
  background: transparent;
  color: var(--color-papel-secundario);
  font-weight: 650;
  cursor: pointer;
}

.ranking-final {
  width: min(100%, 86rem);
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(22rem, 1fr);
  gap: clamp(3rem, 8vw, 9rem);
  align-items: start;
  margin: clamp(4rem, 11vh, 9rem) auto 0;
}

.cierre,
.tabla-final {
  min-width: 0;
}

.cierre > p:first-child {
  margin: 0;
  color: var(--color-acento);
  font-size: 0.8rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

h1 {
  max-width: 10ch;
  margin: 1.25rem 0 0;
  font-size: clamp(3rem, 6.5vw, 6rem);
  letter-spacing: -0.045em;
  line-height: 0.93;
  text-wrap: balance;
}

.cierre__detalle {
  max-width: 34rem;
  margin: 1.75rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 1.05rem;
  line-height: 1.55;
}

.boton--nueva {
  margin-top: 2rem;
  background: var(--color-acento);
  color: var(--color-tinta);
}

.estado-ranking,
.error-ranking,
.conexion {
  margin: 0;
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
  color: var(--color-papel-secundario);
}

.error-ranking button,
.conexion button {
  border: 0;
  border-bottom: 1px solid currentColor;
  padding: 0;
  background: transparent;
  color: var(--color-acento);
  font-weight: 720;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .boton--nueva:hover {
    background: var(--color-acento-activo);
  }
}

@media (max-width: 850px) {
  .barra {
    grid-template-columns: 1fr auto;
  }

  .barra__partida {
    display: none;
  }

  .ranking-final {
    grid-template-columns: 1fr;
    margin-top: 3rem;
  }

  h1 {
    max-width: 12ch;
  }
}
</style>
