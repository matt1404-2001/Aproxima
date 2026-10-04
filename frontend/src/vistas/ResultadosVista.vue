<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import TablaRanking from '../componentes/TablaRanking.vue'
import { useEstadoPartida } from '../composables/useEstadoPartida'
import {
  avanzarRonda,
  consultarRanking,
  consultarResultadosRonda,
  esErrorSesionDefinitivo,
  finalizarPartida,
} from '../servicios/servicioPartidas'
import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'
import { rutaConEstado, rutaParaEstado } from '../utilidades/rutasPartida'

const router = useRouter()
const route = useRoute()
const sesion = obtenerSesion()
const estadoInicial = window.history.state?.estadoPartida || null
const resultados = ref(null)
const ranking = ref(null)
const cargandoDatos = ref(false)
const errorDatos = ref('')
const accionEnCurso = ref(false)
const errorAccion = ref('')
const confirmandoFinal = ref(false)
const confirmacionFinal = ref(null)
const botonControl = ref(null)
let controladorDatos = null
let controladorAccion = null

const {
  estadoPartida: estadoConsultado,
  desconectado,
  sesionInvalida,
  reintentar,
  detener,
} = useEstadoPartida(sesion, { alActualizar: procesarEstado })

const estadoPartida = computed(() => estadoConsultado.value || estadoInicial)
const resumen = computed(() => estadoPartida.value?.resultados || null)
const esAnfitrion = computed(() => estadoPartida.value?.rol === 'ANFITRION')
const puedeAvanzar = computed(() => esAnfitrion.value && Boolean(resumen.value?.puedeAvanzar))
const puedeFinalizar = computed(() => esAnfitrion.value && Boolean(resumen.value?.puedeFinalizar))
const estadisticas = computed(() => resultados.value?.estadisticas || null)
const resultadoPersonal = computed(() => resultados.value?.resultadoPersonal || null)
const fuenteSegura = computed(() => {
  if (!resultados.value?.fuente) return ''
  try {
    const fuente = new URL(resultados.value.fuente)
    return ['http:', 'https:'].includes(fuente.protocol) ? fuente.href : ''
  } catch {
    return ''
  }
})
const tituloResultados = computed(() => {
  if (resultados.value) return resultados.value.enunciado
  return 'Preparando resultados…'
})
const motivoCierre = computed(() =>
  resultados.value?.motivoCierre === 'TODOS_RESPONDIERON'
    ? 'Todos los jugadores respondieron. La ronda terminó anticipadamente.'
    : 'El tiempo de la ronda terminó.',
)

watch(sesionInvalida, async (esInvalida) => {
  if (!esInvalida) return
  cancelarSolicitudes()
  eliminarSesion()
  await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
})

onMounted(cargarDatos)
onUnmounted(cancelarSolicitudes)

async function procesarEstado(nuevoEstado) {
  const destino = rutaParaEstado(nuevoEstado)
  if (router.resolve(destino).fullPath === route.fullPath) {
    if ((!resultados.value || !ranking.value || errorDatos.value) && !cargandoDatos.value) {
      cargarDatos()
    }
    return
  }

  if (nuevoEstado.estado === 'RESULTADOS') {
    controladorDatos?.abort()
    controladorAccion?.abort()
    controladorDatos = null
    controladorAccion = null
    resultados.value = null
    ranking.value = null
    cargandoDatos.value = false
    accionEnCurso.value = false
    confirmandoFinal.value = false
    errorDatos.value = ''
    errorAccion.value = ''
    await router.replace(rutaConEstado(nuevoEstado))
    cargarDatos()
    return
  }

  cancelarSolicitudes()
  await router.replace(rutaConEstado(nuevoEstado))
}

async function cargarDatos() {
  const rondaId = resumen.value?.rondaId
  if (!rondaId || cargandoDatos.value) return

  controladorDatos?.abort()
  const controlador = new AbortController()
  controladorDatos = controlador
  cargandoDatos.value = true
  errorDatos.value = ''

  const consultas = await Promise.allSettled([
    consultarResultadosRonda(sesion.partidaId, rondaId, sesion.token, controlador.signal),
    consultarRanking(sesion.partidaId, sesion.token, controlador.signal),
  ])

  if (controlador.signal.aborted || resumen.value?.rondaId !== rondaId) return

  const [consultaResultados, consultaRanking] = consultas
  if (consultaResultados.status === 'fulfilled') resultados.value = consultaResultados.value
  if (consultaRanking.status === 'fulfilled') ranking.value = consultaRanking.value

  const error = [consultaResultados, consultaRanking].find(
    (consulta) => consulta.status === 'rejected' && consulta.reason?.name !== 'AbortError',
  )?.reason

  if (error) {
    if (esErrorSesionDefinitivo(error)) {
      eliminarSesion()
      await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
    } else {
      errorDatos.value = error.message || 'No fue posible obtener los resultados.'
    }
  }

  if (controladorDatos === controlador) {
    controladorDatos = null
    cargandoDatos.value = false
  }
}

async function ejecutarControl() {
  if (accionEnCurso.value || (!puedeAvanzar.value && !puedeFinalizar.value)) return
  if (puedeFinalizar.value && !confirmandoFinal.value) {
    confirmandoFinal.value = true
    await nextTick()
    confirmacionFinal.value?.focus()
    return
  }

  const rondaId = resumen.value.rondaId
  const controlador = new AbortController()
  controladorAccion = controlador
  accionEnCurso.value = true
  errorAccion.value = ''

  try {
    if (puedeAvanzar.value) {
      const transicion = await avanzarRonda(
        sesion.partidaId,
        rondaId,
        sesion.token,
        controlador.signal,
      )
      cancelarSolicitudes()
      await router.replace(rutaConEstado(transicion.estadoPartida))
      return
    }

    const finalizada = await finalizarPartida(
      sesion.partidaId,
      rondaId,
      sesion.token,
      controlador.signal,
    )
    cancelarSolicitudes()
    await router.replace({
      name: 'ranking',
      params: { partidaId: sesion.partidaId },
      state: { rankingFinal: finalizada.ranking },
    })
  } catch (error) {
    if (error?.name === 'AbortError') return
    if (esErrorSesionDefinitivo(error)) {
      eliminarSesion()
      await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
      return
    }

    errorAccion.value = error.message || 'No fue posible actualizar la partida.'
    reintentar()
  } finally {
    if (controladorAccion === controlador) {
      controladorAccion = null
      accionEnCurso.value = false
    }
  }
}

async function cancelarConfirmacion() {
  if (accionEnCurso.value) return
  confirmandoFinal.value = false
  await nextTick()
  botonControl.value?.focus()
}

function cancelarSolicitudes() {
  controladorDatos?.abort()
  controladorAccion?.abort()
  controladorDatos = null
  controladorAccion = null
  detener()
}

function formatearNumero(valor, maximoDecimales = 0) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('es-CR', { maximumFractionDigits: maximoDecimales })
}

async function salir() {
  cancelarSolicitudes()
  eliminarSesion()
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main class="resultados-vista">
    <header class="barra">
      <div class="marca">
        <span aria-hidden="true" /> Estimate Arena
      </div>
      <div class="barra__partida">
        Partida {{ estadoPartida?.codigo || sesion?.codigo || '-----' }}
      </div>
      <button
        class="salir"
        type="button"
        @click="salir"
      >
        Salir
      </button>
    </header>

    <div class="tablero-resultados">
      <section
        class="resultado-principal"
        aria-labelledby="titulo-resultados"
      >
        <p class="ronda-indicador">
          {{ resultados ? `Ronda ${resultados.numero} de ${resultados.totalRondas}` : 'Resultados de la ronda' }}
        </p>
        <h1 id="titulo-resultados">
          {{ tituloResultados }}
        </h1>

        <div
          v-if="resultados"
          class="respuesta-correcta"
        >
          <span>La respuesta correcta es</span>
          <strong>{{ formatearNumero(resultados.respuestaCorrecta) }}</strong>
          <small>{{ resultados.unidad }}</small>
        </div>

        <p
          v-if="resultados"
          class="motivo-cierre"
          role="status"
        >
          {{ motivoCierre }}
        </p>

        <section
          v-if="resultadoPersonal"
          class="resultado-personal"
          aria-labelledby="titulo-personal"
        >
          <div>
            <h2 id="titulo-personal">
              Tu ronda
            </h2>
            <p v-if="resultadoPersonal.respondio">
              Estimaste {{ formatearNumero(resultadoPersonal.estimacion) }} {{ resultados.unidad }}.
            </p>
            <p v-else>
              No enviaste una estimación.
            </p>
          </div>
          <dl>
            <div>
              <dt>Diferencia</dt>
              <dd>{{ resultadoPersonal.respondio ? formatearNumero(resultadoPersonal.diferenciaAbsoluta) : '—' }}</dd>
            </div>
            <div>
              <dt>Puntos</dt>
              <dd>{{ formatearNumero(resultadoPersonal.puntos) }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="estadisticas"
          class="estadisticas"
          aria-labelledby="titulo-estadisticas"
        >
          <header>
            <h2 id="titulo-estadisticas">
              La arena respondió
            </h2>
            <p>{{ estadisticas.cantidadRespuestas }} de {{ estadisticas.totalJugadores }} jugadores</p>
          </header>
          <p
            v-if="!estadisticas.hayRespuestas"
            class="sin-respuestas"
          >
            Ningún jugador respondió esta ronda.
          </p>
          <dl v-else>
            <div><dt>Mínima</dt><dd>{{ formatearNumero(estadisticas.estimacionMinima) }}</dd></div>
            <div><dt>Promedio</dt><dd>{{ formatearNumero(estadisticas.promedio, 2) }}</dd></div>
            <div><dt>Máxima</dt><dd>{{ formatearNumero(estadisticas.estimacionMaxima) }}</dd></div>
          </dl>
        </section>

        <div
          v-if="resultados?.explicacion || resultados?.fuente"
          class="contexto-dato"
        >
          <p v-if="resultados.explicacion">
            {{ resultados.explicacion }}
          </p>
          <a
            v-if="fuenteSegura"
            :href="fuenteSegura"
            target="_blank"
            rel="noreferrer"
          >
            Consultar fuente
          </a>
        </div>

        <div
          v-if="errorDatos"
          class="aviso aviso--error"
          role="alert"
        >
          <p>{{ errorDatos }}</p>
          <button
            type="button"
            @click="cargarDatos"
          >
            Reintentar resultados
          </button>
        </div>
      </section>

      <aside class="panel-lateral">
        <section
          v-if="esAnfitrion"
          class="control-anfitrion"
          aria-labelledby="titulo-control"
        >
          <div
            v-if="confirmandoFinal"
            ref="confirmacionFinal"
            class="confirmacion-final"
            role="region"
            aria-label="Confirmar finalización de la partida"
            tabindex="-1"
          >
            <h2 id="titulo-control">
              ¿Finalizar la partida?
            </h2>
            <p>La clasificación pasará a ser definitiva y no se podrán jugar más rondas.</p>
            <div class="control-anfitrion__acciones">
              <button
                class="boton boton--accion"
                type="button"
                :disabled="accionEnCurso"
                @click="ejecutarControl"
              >
                {{ accionEnCurso ? 'Finalizando…' : 'Confirmar finalización' }}
              </button>
              <button
                class="cancelar"
                type="button"
                :disabled="accionEnCurso"
                @click="cancelarConfirmacion"
              >
                Seguir revisando
              </button>
            </div>
          </div>
          <template v-else>
            <h2 id="titulo-control">
              El ritmo es tuyo
            </h2>
            <p>{{ puedeFinalizar ? 'La quinta ronda terminó. Cuando estés listo, muestra la clasificación final.' : 'Los jugadores permanecerán aquí hasta que abras la siguiente ronda.' }}</p>
            <button
              ref="botonControl"
              class="boton boton--accion"
              type="button"
              :disabled="accionEnCurso || (!puedeAvanzar && !puedeFinalizar)"
              @click="ejecutarControl"
            >
              {{ accionEnCurso ? 'Preparando…' : puedeFinalizar ? 'Finalizar partida' : 'Siguiente ronda' }}
            </button>
          </template>
          <p
            v-if="errorAccion"
            class="error-accion"
            role="alert"
          >
            {{ errorAccion }}
          </p>
        </section>

        <p
          v-else
          class="espera-anfitrion"
        >
          Esperando a que el anfitrión continúe.
        </p>

        <div
          v-if="desconectado"
          class="aviso"
          role="status"
        >
          <p>Se perdió la conexión. Los últimos resultados visibles se conservaron.</p>
          <button
            type="button"
            @click="reintentar"
          >
            Reintentar conexión
          </button>
        </div>

        <TablaRanking
          v-if="ranking"
          :ranking="ranking"
        />
        <p
          v-else-if="cargandoDatos"
          class="cargando-ranking"
        >
          Actualizando la clasificación…
        </p>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.resultados-vista {
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

.barra__partida,
.ronda-indicador {
  color: var(--color-acento);
  font-size: 0.78rem;
  font-weight: 720;
  letter-spacing: 0.07em;
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

.tablero-resultados {
  width: min(100%, 92rem);
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(20rem, 0.75fr);
  gap: clamp(2.5rem, 6vw, 7rem);
  align-items: start;
  margin: clamp(3rem, 7vh, 6rem) auto 0;
}

.resultado-principal,
.panel-lateral {
  min-width: 0;
}

.ronda-indicador {
  margin: 0;
}

h1 {
  max-width: 17ch;
  margin: 1.25rem 0 0;
  font-size: clamp(2.4rem, 5.8vw, 5.25rem);
  letter-spacing: -0.04em;
  line-height: 0.98;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.respuesta-correcta {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  margin-top: clamp(2.5rem, 7vh, 5rem);
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
}

.respuesta-correcta span,
.respuesta-correcta small {
  color: var(--color-papel-secundario);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.respuesta-correcta strong {
  grid-row: span 2;
  max-width: 12ch;
  color: var(--color-acento);
  font-size: clamp(3.2rem, 8vw, 7rem);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.055em;
  line-height: 0.78;
  overflow-wrap: anywhere;
}

.motivo-cierre {
  margin: 1.25rem 0 0;
  color: var(--color-papel-secundario);
}

.resultado-personal,
.estadisticas {
  margin-top: 3rem;
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1.25rem;
}

.resultado-personal {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
}

.resultado-personal h2,
.estadisticas h2,
.control-anfitrion h2 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.resultado-personal p,
.estadisticas header p,
.control-anfitrion p {
  margin: 0.6rem 0 0;
  color: var(--color-papel-secundario);
  line-height: 1.5;
}

.resultado-personal dl,
.estadisticas dl {
  display: flex;
  gap: clamp(1.5rem, 4vw, 4rem);
  margin: 0;
}

dt {
  color: var(--color-papel-secundario);
  font-size: 0.72rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

dd {
  margin: 0.4rem 0 0;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}

.estadisticas header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.estadisticas dl {
  justify-content: space-between;
  margin-top: 1.5rem;
}

.sin-respuestas {
  margin: 1.5rem 0 0;
  color: var(--color-papel-secundario);
}

.contexto-dato {
  margin-top: 2rem;
  color: var(--color-papel-secundario);
  line-height: 1.55;
}

.contexto-dato a,
.aviso button,
.cancelar {
  border: 0;
  border-bottom: 1px solid currentColor;
  padding: 0;
  background: transparent;
  color: var(--color-acento);
  font-weight: 720;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.panel-lateral {
  display: grid;
  gap: 2.5rem;
}

.control-anfitrion {
  border-radius: 1rem;
  padding: 1.5rem;
  background: var(--color-papel);
  color: var(--color-tinta);
}

.control-anfitrion p {
  color: var(--color-texto-suave);
}

.boton--accion {
  width: 100%;
  margin-top: 1.5rem;
  background: var(--color-acento);
  color: var(--color-tinta);
}

.control-anfitrion__acciones {
  display: grid;
  gap: 1rem;
}

.cancelar {
  justify-self: center;
  min-height: 2.75rem;
  color: var(--color-texto-suave);
}

.control-anfitrion .error-accion {
  color: var(--color-error);
  font-size: 0.85rem;
  font-weight: 680;
}

.espera-anfitrion,
.cargando-ranking {
  margin: 0;
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
  color: var(--color-papel-secundario);
}

.aviso {
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1rem;
}

.aviso p {
  margin: 0 0 0.75rem;
  color: var(--color-papel-secundario);
  line-height: 1.5;
}

.aviso--error {
  margin-top: 2rem;
}

@media (hover: hover) and (pointer: fine) {
  .boton--accion:hover:not(:disabled) {
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

  .tablero-resultados {
    grid-template-columns: 1fr;
    margin-top: 2.5rem;
  }

  .panel-lateral {
    gap: 2rem;
  }
}

@media (max-width: 520px) {
  .resultado-personal {
    grid-template-columns: 1fr;
  }

  .estadisticas header {
    align-items: start;
    flex-direction: column;
  }

  .estadisticas dl {
    gap: 1rem;
  }

  dd {
    font-size: 1.45rem;
  }
}
</style>
