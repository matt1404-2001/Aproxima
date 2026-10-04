<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import {
  esErrorSesionDefinitivo,
  recuperarSesion,
} from './servicios/servicioPartidas'
import { eliminarSesion, guardarSesion, obtenerSesion } from './servicios/servicioSesion'
import { rutaConEstado } from './utilidades/rutasPartida'

const router = useRouter()
// El servicio de sesión obtiene la identidad guardada en localStorage.
const sesionInicial = obtenerSesion()
const recuperando = ref(Boolean(sesionInicial))
const errorRecuperacion = ref('')
const mensajeRecuperacion = computed(
  () =>
    errorRecuperacion.value ||
    'Estamos consultando el estado oficial de la partida antes de devolverte a la arena.',
)

// onMounted recupera la sesión cuando la aplicación ya está lista en el navegador.
onMounted(() => {
  if (sesionInicial) recuperar()
})

async function recuperar() {
  // El servicio consulta la API y Vue Router abre la vista del estado recuperado.
  const sesion = obtenerSesion()
  if (!sesion) {
    recuperando.value = false
    return
  }

  recuperando.value = true
  errorRecuperacion.value = ''

  try {
    const recuperada = await recuperarSesion(sesion.partidaId, sesion.token)
    guardarSesion({
      ...sesion,
      codigo: recuperada.estadoPartida.codigo,
      rol: recuperada.rol,
      jugador: recuperada.jugador,
    })
    await router.replace(
      rutaConEstado(recuperada.estadoPartida, { sesionRecuperada: true }),
    )
    recuperando.value = false
  } catch (error) {
    if (esErrorSesionDefinitivo(error, { accesoDenegadoEsDefinitivo: true })) {
      eliminarSesion()
      recuperando.value = false
      await router.replace({
        name: 'inicio',
        query: {
          sesion:
            error.codigo === 'PARTIDA_NO_ENCONTRADA' ? 'partida-no-disponible' : 'invalida',
        },
      })
      return
    }

    errorRecuperacion.value =
      'No fue posible comunicarse con el servidor. Revisa tu conexión e inténtalo nuevamente.'
  }
}

async function descartarSesion() {
  // Al eliminar la sesión, la navegación vuelve a la pantalla pública de inicio.
  eliminarSesion()
  recuperando.value = false
  await router.replace({ name: 'inicio' })
}
</script>

<template>
  <main
    v-if="recuperando"
    class="recuperacion"
  >
    <section
      class="recuperacion__contenido"
      aria-labelledby="titulo-recuperacion"
    >
      <div class="marca">
        <span aria-hidden="true" /> Estimate Arena
      </div>
      <p class="estado-recuperacion">
        {{ errorRecuperacion ? 'Conexión interrumpida' : 'Validando identidad' }}
      </p>
      <h1 id="titulo-recuperacion">
        {{ errorRecuperacion ? 'Tu lugar sigue reservado.' : 'Recuperando tu sesión…' }}
      </h1>
      <p class="descripcion-recuperacion">
        {{ mensajeRecuperacion }}
      </p>
      <div
        v-if="errorRecuperacion"
        class="acciones-recuperacion"
      >
        <button
          class="boton boton--acento"
          type="button"
          @click="recuperar"
        >
          Reintentar conexión
        </button>
        <button
          class="boton boton--discreto"
          type="button"
          @click="descartarSesion"
        >
          Salir de la partida
        </button>
      </div>
    </section>
  </main>
  <!-- RouterView renderiza la vista que corresponde a la ruta actual. -->
  <RouterView v-else />
</template>

<style scoped>
.recuperacion {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: var(--color-tinta);
  color: var(--color-papel);
}

.recuperacion__contenido {
  width: min(100%, 46rem);
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
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: var(--color-acento);
}

.estado-recuperacion {
  margin: clamp(4rem, 12vh, 8rem) 0 0;
  color: var(--color-acento);
  font-size: 0.82rem;
  font-weight: 720;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

h1 {
  max-width: 11ch;
  margin: 1rem 0 0;
  font-size: clamp(3rem, 8vw, 5.8rem);
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-wrap: balance;
}

.descripcion-recuperacion {
  max-width: 42rem;
  margin: 1.5rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 1.05rem;
  line-height: 1.6;
}

.acciones-recuperacion {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.boton--acento {
  background: var(--color-acento);
  color: var(--color-tinta);
}

.boton--discreto {
  border-color: var(--color-linea-oscura);
  background: transparent;
  color: var(--color-papel);
}
</style>
