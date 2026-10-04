<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FormularioIngreso from '../componentes/FormularioIngreso.vue'
import { crearPartida, ingresarJugador } from '../servicios/servicioPartidas'
import {
  almacenamientoDisponible,
  guardarSesion,
} from '../servicios/servicioSesion'

const router = useRouter()
const route = useRoute()
const modo = ref('elegir')
const pendiente = ref(false)
const errorAcceso = ref('')
const avisoSesion = computed(() => {
  if (route.query.sesion === 'partida-no-disponible') {
    return 'La partida guardada ya no está disponible. Puedes crear o ingresar a otra.'
  }
  if (route.query.sesion === 'invalida') {
    return 'No fue posible recuperar la sesión anterior. Ingresa nuevamente a una partida.'
  }
  return ''
})

function mostrarIngreso() {
  errorAcceso.value = ''
  modo.value = 'ingresar'
}

function mostrarOpciones() {
  errorAcceso.value = ''
  modo.value = 'elegir'
}

async function crear() {
  if (!comprobarAlmacenamiento()) return

  pendiente.value = true
  errorAcceso.value = ''
  try {
    const partida = await crearPartida()
    guardarSesion({
      partidaId: partida.partidaId,
      codigo: partida.codigo,
      rol: 'ANFITRION',
      token: partida.tokenAnfitrion,
    })
    await router.push({ name: 'lobby', params: { partidaId: partida.partidaId } })
  } catch (error) {
    errorAcceso.value = mensajeAcceso(error, 'No fue posible crear la partida.')
  } finally {
    pendiente.value = false
  }
}

async function ingresar({ codigo, nombre }) {
  if (!comprobarAlmacenamiento()) return

  pendiente.value = true
  errorAcceso.value = ''
  try {
    const ingreso = await ingresarJugador(codigo, nombre)
    guardarSesion({
      partidaId: ingreso.partidaId,
      codigo: ingreso.codigo,
      rol: 'JUGADOR',
      token: ingreso.tokenJugador,
      jugador: ingreso.jugador,
    })
    await router.push({ name: 'lobby', params: { partidaId: ingreso.partidaId } })
  } catch (error) {
    errorAcceso.value = mensajeAcceso(error, 'No fue posible ingresar a la partida.')
  } finally {
    pendiente.value = false
  }
}

function comprobarAlmacenamiento() {
  if (almacenamientoDisponible()) return true
  errorAcceso.value =
    'Este navegador debe permitir el almacenamiento local para conservar tu sesión.'
  return false
}

function mensajeAcceso(error, mensajePredeterminado) {
  return error?.message || mensajePredeterminado
}
</script>

<template>
  <main class="inicio">
    <section
      class="presentacion"
      aria-labelledby="titulo-principal"
    >
      <div class="marca">
        <span
          class="marca__pulso"
          aria-hidden="true"
        />
        <span>Estimate Arena</span>
      </div>

      <div class="presentacion__contenido">
        <div
          class="presentacion__numero"
          aria-hidden="true"
        >
          <strong>05</strong>
          <span>rondas</span>
        </div>
        <h1 id="titulo-principal">
          No necesitas saberlo. Necesitas acercarte.
        </h1>
        <p class="presentacion__descripcion">
          Cinco preguntas, treinta segundos y una sola estimación. La respuesta más cercana
          domina la arena.
        </p>
      </div>

      <dl
        class="reglas-rapidas"
        aria-label="Reglas principales"
      >
        <div>
          <dt>Rondas</dt>
          <dd>5</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>30 s</dd>
        </div>
        <div>
          <dt>Jugadores</dt>
          <dd>2–40</dd>
        </div>
      </dl>
    </section>

    <section
      class="acceso"
      aria-labelledby="titulo-acceso"
    >
      <div class="acceso__interior">
        <div class="acceso__cabecera">
          <p class="acceso__estado">
            <span aria-hidden="true" /> Arena disponible
          </p>
          <h2 id="titulo-acceso">
            {{ modo === 'ingresar' ? 'Entra a la partida' : 'Elige tu entrada' }}
          </h2>
          <p v-if="modo === 'ingresar'">
            Escribe el código de la pantalla y el nombre que verán los demás.
          </p>
          <p v-else>
            Crea una sala para dirigir el juego o usa el código que comparte el anfitrión.
          </p>
        </div>

        <FormularioIngreso
          v-if="modo === 'ingresar'"
          :pendiente="pendiente"
          :error-externo="errorAcceso"
          @enviar="ingresar"
          @cancelar="mostrarOpciones"
        />

        <template v-else>
          <p
            v-if="avisoSesion"
            class="aviso-sesion"
            role="status"
          >
            {{ avisoSesion }}
          </p>
          <div
            class="acciones"
            role="group"
            aria-label="Opciones de acceso"
          >
            <button
              class="boton boton--principal"
              type="button"
              :disabled="pendiente"
              :aria-busy="pendiente"
              @click="crear"
            >
              {{ pendiente ? 'Creando arena…' : 'Crear una partida' }}
            </button>
            <button
              class="boton boton--secundario"
              type="button"
              :disabled="pendiente"
              @click="mostrarIngreso"
            >
              Ingresar con código
            </button>
          </div>

          <p
            v-if="errorAcceso"
            class="mensaje-error"
            role="alert"
          >
            {{ errorAcceso }}
          </p>
          <p
            v-else
            class="acceso__nota"
          >
            No necesitas cuenta. Tu sesión queda guardada únicamente en este navegador.
          </p>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
.inicio {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 0.75fr);
}

.presentacion,
.acceso {
  padding: clamp(1.5rem, 4vw, 4rem);
}

.presentacion {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--color-tinta);
  color: var(--color-papel);
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 0.9rem;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.marca__pulso {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--color-acento);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--color-acento) 18%, transparent);
}

.presentacion__contenido {
  display: grid;
  grid-template-columns: minmax(4rem, 0.22fr) minmax(0, 1fr);
  column-gap: clamp(1rem, 4vw, 4rem);
  align-items: start;
  max-width: 68rem;
}

.presentacion__numero {
  display: grid;
  gap: 0.35rem;
  margin: 0.45rem 0 0;
  color: var(--color-acento);
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
}

.presentacion__numero strong {
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 800;
}

.presentacion__numero span {
  font-size: 0.8rem;
  font-weight: 720;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  grid-column: 2;
  max-width: 13ch;
  margin: 0;
  font-size: clamp(3.2rem, 7.4vw, 6rem);
  font-weight: 780;
  letter-spacing: -0.04em;
  line-height: 0.9;
  text-wrap: balance;
}

.presentacion__descripcion {
  grid-column: 2;
  max-width: 39rem;
  margin: 2rem 0 0;
  color: var(--color-papel-secundario);
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  line-height: 1.55;
}

.reglas-rapidas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 3rem 0 0;
  border-top: 1px solid var(--color-linea-oscura);
}

.reglas-rapidas div {
  padding: 1.1rem 1rem 0 0;
}

.reglas-rapidas div + div {
  padding-left: 1rem;
  border-left: 1px solid var(--color-linea-oscura);
}

.reglas-rapidas dt {
  color: var(--color-papel-secundario);
  font-size: 0.82rem;
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.reglas-rapidas dd {
  margin: 0.4rem 0 0;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 760;
}

.acceso {
  display: flex;
  min-height: 100dvh;
  align-items: center;
  background: var(--color-papel);
  color: var(--color-tinta);
}

.acceso__interior {
  width: min(100%, 29rem);
  margin-inline: auto;
}

.acceso__estado {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 3rem;
  color: var(--color-texto-suave);
  font-size: 0.9rem;
  font-weight: 680;
}

.acceso__estado span {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-exito);
}

h2 {
  margin: 0;
  font-size: clamp(2.2rem, 4vw, 3.5rem);
  font-weight: 760;
  letter-spacing: -0.035em;
  line-height: 1;
}

.acceso__cabecera > p:last-child {
  max-width: 39ch;
  margin: 1.25rem 0 0;
  color: var(--color-texto-suave);
  line-height: 1.55;
}

.acciones {
  display: grid;
  gap: 0.75rem;
  margin-top: 2.5rem;
}

.aviso-sesion {
  margin: 2rem 0 -1rem;
  border-top: 1px solid var(--color-linea);
  padding-top: 0.9rem;
  color: var(--color-texto-suave);
  font-size: 0.88rem;
  line-height: 1.5;
}

.acceso__nota,
.mensaje-error {
  margin: 1.5rem 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
}

.acceso__nota {
  color: var(--color-texto-suave);
}

.mensaje-error {
  border-top: 1px solid var(--color-error);
  padding-top: 0.9rem;
  color: var(--color-error);
  font-weight: 620;
}

@media (max-width: 800px) {
  .inicio {
    display: flex;
    flex-direction: column;
  }

  .presentacion,
  .acceso {
    min-height: auto;
  }

  .presentacion {
    min-height: 62dvh;
    gap: 4rem;
  }

  .presentacion__contenido {
    grid-template-columns: 1fr;
  }

  .presentacion__numero {
    margin-bottom: 1rem;
  }

  h1,
  .presentacion__descripcion {
    grid-column: 1;
  }

  h1 {
    font-size: clamp(3rem, 14vw, 5rem);
  }

  .acceso {
    order: -1;
    width: 100%;
    min-width: 0;
    min-height: 88dvh;
    padding-block: 3rem;
  }

  .acceso__interior {
    width: min(calc(100vw - 3rem), 29rem);
  }
}

@media (max-width: 420px) {
  .presentacion,
  .acceso {
    padding-inline: 1.25rem;
  }

  .acceso__interior {
    width: calc(100vw - 2.5rem);
  }

  .reglas-rapidas div {
    padding-right: 0.55rem;
  }

  .reglas-rapidas div + div {
    padding-left: 0.55rem;
  }

  .reglas-rapidas dt {
    font-size: 0.68rem;
  }
}
</style>
