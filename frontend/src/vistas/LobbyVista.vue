<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useEstadoPartida } from '../composables/useEstadoPartida'
import {
  esErrorSesionDefinitivo,
  iniciarPartida,
} from '../servicios/servicioPartidas'
import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'
import { rutaConEstado } from '../utilidades/rutasPartida'

const router = useRouter()
const sesion = obtenerSesion()
const copiado = ref(false)
const iniciando = ref(false)
const errorInicio = ref('')
const sesionRecuperada = Boolean(window.history.state?.sesionRecuperada)
let temporizadorCopiado = null

// useEstadoPartida inicia el polling y entrega refs reactivas con el estado oficial.
const {
  estadoPartida,
  cargando,
  desconectado,
  sesionInvalida,
  reintentar,
  detener,
} = useEstadoPartida(sesion, { alActualizar: cambiarVistaSiCorresponde })

const lobby = computed(() => estadoPartida.value?.lobby || null)
const codigo = computed(() => estadoPartida.value?.codigo || sesion?.codigo || '-----')
const esAnfitrion = computed(() => estadoPartida.value?.rol === 'ANFITRION')
const jugadores = computed(() => lobby.value?.jugadores || [])
const cantidad = computed(() => lobby.value?.cantidadJugadores || 0)
const maximo = computed(() => lobby.value?.maximoJugadores || 40)
const puedeIniciar = computed(() => esAnfitrion.value && Boolean(lobby.value?.puedeIniciar))
const tituloLobby = computed(() => {
  if (cargando.value) return 'Abriendo la arena.'
  return esAnfitrion.value ? 'Reúne a tu equipo.' : 'Tu lugar está listo.'
})
const instruccionLobby = computed(() => {
  if (cargando.value) return 'Estamos consultando el estado oficial y los participantes.'
  return esAnfitrion.value
    ? 'Comparte el código. La partida podrá comenzar cuando haya dos jugadores.'
    : 'La lista se actualiza automáticamente. Espera a que el anfitrión inicie.'
})
const textoEstado = computed(() => {
  if (desconectado.value) return 'Intentando reconectar'
  if (sesionRecuperada) return 'Sesión recuperada · Lobby abierto'
  return 'Lobby abierto'
})

watch(sesionInvalida, async (esInvalida) => {
  // watch reacciona cuando el composable detecta que la credencial dejó de ser válida.
  if (!esInvalida) return
  eliminarSesion()
  await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
})

onUnmounted(() => window.clearTimeout(temporizadorCopiado))

async function cambiarVistaSiCorresponde(nuevoEstado) {
  // El polling cambia de vista cuando el servidor abandona el estado LOBBY.
  if (nuevoEstado.estado === 'LOBBY') return
  detener()
  await router.replace(rutaConEstado(nuevoEstado))
}

async function copiarCodigo() {
  if (!codigo.value || codigo.value === '-----' || !navigator.clipboard) return

  try {
    await navigator.clipboard.writeText(codigo.value)
    copiado.value = true
    window.clearTimeout(temporizadorCopiado)
    temporizadorCopiado = window.setTimeout(() => (copiado.value = false), 1800)
  } catch {
    copiado.value = false
  }
}

async function iniciar() {
  // Esta acción llama al endpoint exclusivo del anfitrión y navega a la primera ronda.
  if (!puedeIniciar.value || iniciando.value) return

  iniciando.value = true
  errorInicio.value = ''
  try {
    const transicion = await iniciarPartida(sesion.partidaId, sesion.token)
    detener()
    await router.replace(rutaConEstado(transicion.estadoPartida))
  } catch (error) {
    if (esErrorSesionDefinitivo(error)) {
      eliminarSesion()
      await router.replace({ name: 'inicio', query: { sesion: 'invalida' } })
      return
    }

    errorInicio.value = error?.message || 'No fue posible iniciar la partida. Inténtalo nuevamente.'
    reintentar()
  } finally {
    iniciando.value = false
  }
}

async function salir() {
  detener()
  eliminarSesion()
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main class="lobby">
    <header class="lobby__barra">
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

    <div class="lobby__tablero">
      <section
        class="panel-codigo"
        aria-labelledby="titulo-lobby"
      >
        <div class="estado-linea">
          <span
            class="estado-linea__punto"
            :class="{ 'estado-linea__punto--alerta': desconectado }"
            aria-hidden="true"
          />
          <span>{{ textoEstado }}</span>
        </div>

        <h1 id="titulo-lobby">
          {{ tituloLobby }}
        </h1>
        <p class="instruccion">
          {{ instruccionLobby }}
        </p>

        <div
          class="codigo"
          aria-label="Código de partida"
        >
          <span>Código de partida</span>
          <strong>{{ codigo }}</strong>
        </div>

        <button
          v-if="esAnfitrion"
          class="boton boton--copiar"
          type="button"
          :disabled="codigo === '-----'"
          @click="copiarCodigo"
        >
          {{ copiado ? 'Código copiado' : 'Copiar código' }}
        </button>
        <p
          class="confirmacion"
          aria-live="polite"
        >
          {{ copiado ? 'El código está listo para compartir.' : '' }}
        </p>

        <p
          v-if="sesion?.persistente === false"
          class="advertencia-sesion"
          role="alert"
        >
          La sesión es temporal. No recargues ni cierres esta página.
        </p>
      </section>

      <section
        class="panel-jugadores"
        aria-labelledby="titulo-jugadores"
        :aria-busy="cargando"
      >
        <div class="panel-jugadores__cabecera">
          <div>
            <h2 id="titulo-jugadores">
              Participantes
            </h2>
            <p>
              {{ cargando ? 'Consultando la arena…' : `${cantidad} de ${maximo} lugares ocupados` }}
            </p>
          </div>
          <strong
            class="contador"
            aria-hidden="true"
          >
            {{ String(cantidad).padStart(2, '0') }}
          </strong>
        </div>

        <div
          v-if="desconectado"
          class="conexion"
          role="status"
        >
          <p>Se perdió la conexión. Tu sesión y los participantes visibles se conservaron.</p>
          <button
            type="button"
            @click="reintentar"
          >
            Reintentar ahora
          </button>
        </div>

        <!-- v-for representa un elemento por cada jugador recibido de la API. -->
        <ol
          v-if="jugadores.length"
          class="participantes"
        >
          <li
            v-for="(jugador, indice) in jugadores"
            :key="jugador.jugadorId"
          >
            <span>{{ String(indice + 1).padStart(2, '0') }}</span>
            <strong>{{ jugador.nombre }}</strong>
            <small v-if="jugador.jugadorId === sesion?.jugador?.jugadorId">Tú</small>
          </li>
        </ol>

        <div
          v-else-if="!cargando"
          class="lista-vacia"
        >
          <strong>Esperando jugadores</strong>
          <p>El primer nombre aparecerá aquí cuando alguien use el código.</p>
        </div>

        <div class="accion-lobby">
          <template v-if="esAnfitrion">
            <button
              class="boton boton--iniciar"
              type="button"
              :disabled="!puedeIniciar || iniciando || desconectado"
              :aria-busy="iniciando"
              @click="iniciar"
            >
              {{ iniciando ? 'Preparando ronda…' : 'Iniciar partida' }}
            </button>
            <p v-if="!puedeIniciar && !cargando">
              Se necesitan al menos 2 jugadores para iniciar.
            </p>
          </template>
          <p
            v-else-if="!cargando"
            class="espera-anfitrion"
          >
            Esperando a que el anfitrión inicie la partida.
          </p>
          <p
            v-if="errorInicio"
            class="error-inicio"
            role="alert"
          >
            {{ errorInicio }}
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.lobby {
  min-height: 100dvh;
  background: var(--color-papel);
  color: var(--color-tinta);
}

.lobby__barra {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  display: grid;
  grid-template-columns: minmax(23rem, 0.84fr) minmax(0, 1.16fr);
  align-items: center;
  padding: clamp(1.25rem, 3vw, 3rem);
  pointer-events: none;
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-papel);
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
  justify-self: end;
  border: 0;
  padding: 0.7rem;
  background: transparent;
  color: var(--color-texto-suave);
  font-weight: 650;
  cursor: pointer;
  pointer-events: auto;
}

.lobby__tablero {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(23rem, 0.84fr) minmax(0, 1.16fr);
}

.panel-codigo,
.panel-jugadores {
  padding: clamp(7.5rem, 13vh, 10rem) clamp(1.5rem, 4vw, 5rem) clamp(2rem, 5vw, 5rem);
}

.panel-codigo {
  display: flex;
  flex-direction: column;
  background: var(--color-tinta);
  color: var(--color-papel);
}

.estado-linea {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-papel-secundario);
  font-size: 0.85rem;
  font-weight: 650;
}

.estado-linea__punto {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-exito);
}

.estado-linea__punto--alerta {
  background: var(--color-acento);
}

h1 {
  max-width: 9ch;
  margin: 1.5rem 0 0;
  font-size: clamp(3rem, 6vw, 5.5rem);
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-wrap: balance;
}

.instruccion {
  max-width: 35rem;
  margin: 1.5rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 1rem;
  line-height: 1.55;
}

.codigo {
  display: grid;
  gap: 0.5rem;
  margin-top: auto;
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1.25rem;
}

.codigo span {
  color: var(--color-papel-secundario);
  font-size: 0.78rem;
  font-weight: 680;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.codigo strong {
  color: var(--color-acento);
  font-size: clamp(4rem, 9vw, 7.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 780;
  letter-spacing: 0.07em;
  line-height: 1;
}

.boton--copiar {
  align-self: flex-start;
  margin-top: 1.5rem;
  background: var(--color-acento);
  color: var(--color-tinta);
}

.confirmacion {
  min-height: 1.4rem;
  margin: 0.65rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 0.82rem;
}

.advertencia-sesion {
  margin: 1rem 0 0;
  color: var(--color-acento);
  font-size: 0.85rem;
  line-height: 1.5;
}

.panel-jugadores {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.panel-jugadores__cabecera {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  border-bottom: 1px solid var(--color-linea);
  padding-bottom: 1.25rem;
}

h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: -0.035em;
  line-height: 1;
}

.panel-jugadores__cabecera p {
  margin: 0.7rem 0 0;
  color: var(--color-texto-suave);
  font-size: 0.9rem;
}

.contador {
  color: var(--color-texto-suave);
  font-size: clamp(2rem, 5vw, 4rem);
  font-variant-numeric: tabular-nums;
  line-height: 0.85;
}

.conexion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-linea);
  padding: 1rem 0;
}

.conexion p {
  margin: 0;
  color: var(--color-error);
  font-size: 0.88rem;
  line-height: 1.45;
}

.conexion button {
  flex: 0 0 auto;
  border: 0;
  padding: 0.6rem 0;
  background: transparent;
  color: var(--color-tinta);
  font-weight: 720;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.participantes {
  max-height: min(44vh, 31rem);
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  scrollbar-color: var(--color-texto-suave) transparent;
}

.participantes li {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--color-linea);
  padding: 1rem 0;
}

.participantes span {
  color: var(--color-texto-suave);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.participantes strong {
  overflow-wrap: anywhere;
  font-size: 1.05rem;
}

.participantes small {
  color: var(--color-exito);
  font-size: 0.78rem;
  font-weight: 720;
  text-transform: uppercase;
}

.lista-vacia {
  margin: auto 0;
  padding-block: 4rem;
}

.lista-vacia strong {
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.lista-vacia p {
  max-width: 34rem;
  margin: 0.75rem 0 0;
  color: var(--color-texto-suave);
  line-height: 1.55;
}

.accion-lobby {
  margin-top: auto;
  border-top: 1px solid var(--color-linea);
  padding-top: 1.5rem;
}

.boton--iniciar {
  width: 100%;
  background: var(--color-tinta);
  color: var(--color-papel);
}

.accion-lobby > p {
  margin: 0.75rem 0 0;
  color: var(--color-texto-suave);
  font-size: 0.85rem;
  line-height: 1.45;
}

.accion-lobby .espera-anfitrion {
  margin: 0;
  color: var(--color-tinta);
  font-size: 1rem;
  font-weight: 680;
}

.accion-lobby .error-inicio {
  color: var(--color-error);
  font-weight: 650;
}

@media (hover: hover) and (pointer: fine) {
  .salir:hover {
    color: var(--color-tinta);
  }

  .boton--copiar:hover:not(:disabled) {
    background: var(--color-acento-activo);
  }
}

@media (max-width: 800px) {
  .lobby__barra {
    grid-template-columns: 1fr auto;
  }

  .salir {
    color: var(--color-papel-secundario);
  }

  .lobby__tablero {
    grid-template-columns: 1fr;
  }

  .panel-codigo {
    min-height: 78dvh;
  }

  .panel-jugadores {
    min-height: 70dvh;
    padding-top: 4rem;
  }

  .codigo {
    margin-top: 4rem;
  }

  .participantes {
    max-height: none;
  }

  .accion-lobby {
    order: 1;
    margin-top: 0;
    border-top: 0;
  }

  .participantes,
  .lista-vacia {
    order: 2;
  }
}

@media (max-width: 480px) {
  .panel-codigo,
  .panel-jugadores {
    padding-inline: 1.25rem;
  }

  .codigo strong {
    font-size: clamp(3.6rem, 20vw, 5.5rem);
  }

  .conexion {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
