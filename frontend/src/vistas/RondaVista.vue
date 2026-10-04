<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FormularioEstimacion from '../componentes/FormularioEstimacion.vue'
import { useContadorRonda } from '../composables/useContadorRonda'
import { useEstadoPartida } from '../composables/useEstadoPartida'
import {
  enviarEstimacion,
  esErrorSesionDefinitivo,
} from '../servicios/servicioPartidas'
import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'
import { rutaConEstado, rutaParaEstado } from '../utilidades/rutasPartida'

const router = useRouter()
const route = useRoute()
const sesion = obtenerSesion()
const estadoInicial = window.history.state?.estadoPartida || null
const sesionRecuperada = Boolean(window.history.state?.sesionRecuperada)
const enviando = ref(false)
const errorEstimacion = ref('')
const estimacionAceptada = ref(null)
const respuestaDuplicada = ref(false)
const rondaCerrada = ref(false)
const rondaDesactualizada = ref(false)
let controladorEnvio = null

const {
  estadoPartida: estadoConsultado,
  cargando,
  desconectado,
  sesionInvalida,
  latenciaEstimadaMs,
  reintentar,
  detener,
} = useEstadoPartida(sesion, { alActualizar: redirigirSiCambio })

const estadoPartida = computed(() => estadoConsultado.value || estadoInicial)
const ronda = computed(() => estadoPartida.value?.ronda || null)
const servidorAhora = computed(() => estadoPartida.value?.servidorAhora || null)
const esJugador = computed(() => estadoPartida.value?.rol === 'JUGADOR')
const participacion = computed(() => ronda.value?.participacion || null)
const respondio = computed(
  () => Boolean(participacion.value?.respondio) || Boolean(estimacionAceptada.value) || respuestaDuplicada.value,
)
const estimacionRegistrada = computed(
  () => participacion.value?.estimacion ?? estimacionAceptada.value?.valor ?? null,
)
const progreso = computed(() => {
  if (!ronda.value) return 0
  return Math.min(100, (ronda.value.numero / ronda.value.totalRondas) * 100)
})
const { segundosRestantes } = useContadorRonda(ronda, servidorAhora, latenciaEstimadaMs)
const tiempoAgotado = computed(() => Boolean(ronda.value) && segundosRestantes.value === 0)
const textoTiempo = computed(() => String(segundosRestantes.value).padStart(2, '0'))
const textoBloqueo = computed(() => {
  if (rondaDesactualizada.value) return 'Actualizando ronda'
  if (rondaCerrada.value) return 'Ronda finalizada'
  return 'Tiempo finalizado'
})

watch(sesionInvalida, async (esInvalida) => {
  if (!esInvalida) return
  eliminarSesion()
  await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
})

watch(tiempoAgotado, (agotado) => {
  if (!agotado) return
  reintentar()
})

watch(
  () => ronda.value?.rondaId,
  (rondaId, rondaAnteriorId) => {
    if (!rondaAnteriorId || rondaId === rondaAnteriorId) return
    controladorEnvio?.abort()
    controladorEnvio = null
    enviando.value = false
    errorEstimacion.value = ''
    estimacionAceptada.value = null
    respuestaDuplicada.value = false
    rondaCerrada.value = false
    rondaDesactualizada.value = false
  },
)

onUnmounted(() => controladorEnvio?.abort())

async function redirigirSiCambio(nuevoEstado) {
  const destino = rutaParaEstado(nuevoEstado)
  if (router.resolve(destino).fullPath === route.fullPath) return
  await router.replace(rutaConEstado(nuevoEstado))
}

async function registrarEstimacion(valor) {
  if (!esJugador.value || enviando.value || respondio.value || tiempoAgotado.value) return

  enviando.value = true
  errorEstimacion.value = ''
  const rondaIdSolicitud = ronda.value.rondaId
  const controlador = new AbortController()
  controladorEnvio = controlador

  try {
    const respuesta = await enviarEstimacion(
      sesion.partidaId,
      rondaIdSolicitud,
      sesion.token,
      valor,
      controlador.signal,
    )
    if (ronda.value?.rondaId !== rondaIdSolicitud) return
    estimacionAceptada.value = respuesta
    reintentar()
  } catch (error) {
    if (error?.name === 'AbortError' || ronda.value?.rondaId !== rondaIdSolicitud) return

    if (esErrorSesionDefinitivo(error)) {
      eliminarSesion()
      await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
      return
    }

    if (error?.codigo === 'ESTIMACION_DUPLICADA') respuestaDuplicada.value = true
    if (error?.codigo === 'RONDA_CERRADA') rondaCerrada.value = true
    if (error?.codigo === 'RONDA_NO_VIGENTE') rondaDesactualizada.value = true

    errorEstimacion.value = error?.message || 'No fue posible guardar tu estimación.'
    if (respuestaDuplicada.value || rondaCerrada.value || rondaDesactualizada.value) reintentar()
  } finally {
    if (controladorEnvio === controlador) {
      controladorEnvio = null
      enviando.value = false
    }
  }
}

async function salir() {
  controladorEnvio?.abort()
  detener()
  eliminarSesion()
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main class="ronda-vista">
    <header class="barra">
      <div class="marca">
        <span aria-hidden="true" /> Estimate Arena
      </div>
      <div class="barra__partida">
        Partida {{ estadoPartida?.codigo || '-----' }}
      </div>
      <button
        class="salir"
        type="button"
        @click="salir"
      >
        Salir
      </button>
    </header>

    <div
      v-if="ronda"
      class="ronda"
    >
      <section
        class="desafio"
        aria-labelledby="titulo-desafio"
      >
        <div
          class="progreso"
          aria-hidden="true"
        >
          <span :style="{ transform: `scaleX(${progreso / 100})` }" />
        </div>
        <div class="desafio__meta">
          <p>Ronda {{ ronda.numero }} de {{ ronda.totalRondas }}</p>
          <p>{{ ronda.unidad }}</p>
        </div>

        <p
          v-if="sesionRecuperada"
          class="sesion-recuperada"
          role="status"
        >
          Sesión recuperada correctamente
        </p>
        <h1 id="titulo-desafio">
          {{ ronda.enunciado }}
        </h1>
        <p class="instruccion">
          {{ esJugador ? `Responde en ${ronda.unidad}. Tu primera estimación será definitiva.` : `Los jugadores responderán en ${ronda.unidad}.` }}
        </p>
      </section>

      <aside
        class="panel-ronda"
        aria-label="Tiempo y participación"
      >
        <div
          class="cronometro"
          :class="{ 'cronometro--urgente': segundosRestantes <= 10 }"
        >
          <span>{{ tiempoAgotado ? 'Validando cierre' : 'Tiempo restante' }}</span>
          <strong aria-live="off">{{ textoTiempo }}</strong>
          <small>segundos</small>
        </div>

        <FormularioEstimacion
          v-if="esJugador"
          :unidad="ronda.unidad"
          :respondio="respondio"
          :estimacion-registrada="estimacionRegistrada"
          :enviando="enviando"
          :deshabilitado="tiempoAgotado || rondaCerrada || rondaDesactualizada"
          :texto-deshabilitado="textoBloqueo"
          :mensaje-error="errorEstimacion"
          @enviar="registrarEstimacion"
        />

        <section
          v-else
          class="espera-anfitrion"
        >
          <h2>La ronda está abierta</h2>
          <p>La pregunta permanece visible mientras los jugadores envían sus estimaciones.</p>
        </section>

        <div
          v-if="desconectado"
          class="conexion"
          role="status"
        >
          <p>Se perdió la conexión. Tu sesión y cualquier respuesta confirmada siguen guardadas.</p>
          <button
            type="button"
            @click="reintentar"
          >
            Reintentar ahora
          </button>
        </div>
      </aside>
    </div>

    <section
      v-else
      class="cargando"
      aria-live="polite"
    >
      <p>{{ cargando ? 'Consultando la ronda oficial…' : 'Esperando información de la ronda…' }}</p>
    </section>
  </main>
</template>

<style scoped>
.ronda-vista {
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

.ronda {
  width: min(100%, 92rem);
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(20rem, 0.75fr);
  gap: clamp(2rem, 6vw, 7rem);
  align-items: start;
  margin: clamp(3rem, 8vh, 6.5rem) auto 0;
}

.progreso {
  height: 0.3rem;
  background: var(--color-linea-oscura);
  overflow: hidden;
}

.desafio,
.panel-ronda {
  min-width: 0;
}

.progreso span {
  display: block;
  height: 100%;
  background: var(--color-acento);
  transform-origin: left;
  transition: transform var(--duracion-media) var(--ease-salida);
}

.desafio__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  color: var(--color-acento);
  font-size: 0.8rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.desafio__meta p,
.sesion-recuperada {
  margin: 0;
}

.sesion-recuperada {
  margin-top: 2rem;
  color: var(--color-papel-secundario);
  font-size: 0.84rem;
}

h1 {
  max-width: 15ch;
  margin: clamp(2rem, 6vh, 4.5rem) 0 0;
  font-size: clamp(2.8rem, 7vw, 6rem);
  letter-spacing: -0.04em;
  line-height: 0.96;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.instruccion {
  max-width: 42rem;
  margin: 1.75rem 0 0;
  color: var(--color-papel-secundario);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.55;
}

.panel-ronda {
  display: grid;
  gap: 1rem;
}

.cronometro {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  border-top: 1px solid var(--color-linea-oscura);
  padding: 1rem 0 1.5rem;
}

.cronometro span,
.cronometro small {
  color: var(--color-papel-secundario);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cronometro strong {
  grid-row: span 2;
  color: var(--color-acento);
  font-size: clamp(4rem, 8vw, 7rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.06em;
  line-height: 0.75;
}

.cronometro--urgente strong {
  color: #ff806f;
}

.espera-anfitrion {
  border: 1px solid var(--color-linea-oscura);
  border-radius: 1rem;
  padding: 1.5rem;
}

.espera-anfitrion h2 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.espera-anfitrion p,
.conexion p {
  margin: 0.75rem 0 0;
  color: var(--color-papel-secundario);
  line-height: 1.5;
}

.conexion {
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
}

.conexion button {
  min-height: 2.75rem;
  margin-top: 0.75rem;
  border: 0;
  border-bottom: 1px solid currentColor;
  padding: 0;
  background: transparent;
  color: var(--color-acento);
  font-weight: 720;
  cursor: pointer;
}

.cargando {
  min-height: 70vh;
  display: grid;
  place-items: center;
  color: var(--color-papel-secundario);
}

@media (max-width: 850px) {
  .barra {
    grid-template-columns: 1fr auto;
  }

  .barra__partida {
    display: none;
  }

  .ronda {
    grid-template-columns: 1fr;
    margin-top: 2.5rem;
  }

  h1 {
    margin-top: 2rem;
  }

  .panel-ronda {
    gap: 1.25rem;
  }
}

@media (max-width: 420px) {
  .ronda-vista {
    padding-inline: 1rem;
  }

  .marca {
    font-size: 0.72rem;
  }

  h1 {
    font-size: clamp(2.15rem, 10.5vw, 2.8rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .progreso span {
    transition: none;
  }
}
</style>
