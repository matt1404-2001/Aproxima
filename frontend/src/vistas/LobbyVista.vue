<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { eliminarSesion, obtenerSesion } from '../servicios/servicioSesion'

const router = useRouter()
const sesion = obtenerSesion()
const copiado = ref(false)

const esAnfitrion = computed(() => sesion?.rol === 'ANFITRION')
const codigo = computed(() => sesion?.codigo || '-----')

async function copiarCodigo() {
  if (!sesion?.codigo || !navigator.clipboard) return
  await navigator.clipboard.writeText(sesion.codigo)
  copiado.value = true
  window.setTimeout(() => (copiado.value = false), 1800)
}

async function salir() {
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

    <section
      class="lobby__contenido"
      aria-labelledby="titulo-lobby"
    >
      <p
        class="estado"
        :class="{ 'estado--advertencia': sesion?.persistente === false }"
      >
        <span aria-hidden="true" />
        {{ sesion?.persistente === false ? 'Sesión temporal' : 'Sesión guardada' }}
      </p>
      <p
        v-if="sesion?.persistente === false"
        class="advertencia"
        role="alert"
      >
        No fue posible conservar tu sesión. No recargues ni cierres esta página.
      </p>
      <h1 id="titulo-lobby">
        {{ esAnfitrion ? 'La arena está abierta' : 'Ya estás dentro' }}
      </h1>
      <p class="instruccion">
        {{
          esAnfitrion
            ? 'Comparte este código para que los jugadores puedan ingresar.'
            : `Espera aquí, ${sesion?.jugador?.nombre || 'jugador'}. El anfitrión iniciará la partida.`
        }}
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
        class="boton boton--acento"
        type="button"
        :disabled="!sesion?.codigo"
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
    </section>
  </main>
</template>

<style scoped>
.lobby {
  min-height: 100dvh;
  padding: clamp(1.25rem, 3vw, 3rem);
  background: var(--color-tinta);
  color: var(--color-papel);
}

.lobby__barra {
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

.marca span,
.estado span {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--color-acento);
}

.estado--advertencia span {
  background: var(--color-acento);
}

.advertencia {
  max-width: 36rem;
  margin: 1rem 0 0;
  border-left: 2px solid var(--color-acento);
  padding-left: 0.85rem;
  color: var(--color-papel-secundario);
  font-size: 0.9rem;
  line-height: 1.5;
}

.salir {
  border: 0;
  padding: 0.7rem;
  background: transparent;
  color: var(--color-papel-secundario);
  font-weight: 650;
  cursor: pointer;
}

.lobby__contenido {
  width: min(100%, 62rem);
  margin: clamp(5rem, 12vh, 9rem) auto 0;
}

.estado {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-papel-secundario);
  font-size: 0.9rem;
  font-weight: 650;
}

h1 {
  max-width: 12ch;
  margin: 1.5rem 0 0;
  font-size: clamp(3.2rem, 8vw, 6rem);
  line-height: 0.92;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.instruccion {
  max-width: 38rem;
  margin: 1.5rem 0 0;
  color: var(--color-papel-secundario);
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.55;
}

.codigo {
  display: grid;
  gap: 0.5rem;
  margin-top: clamp(3rem, 8vh, 6rem);
  border-top: 1px solid var(--color-linea-oscura);
  padding-top: 1.25rem;
}

.codigo span {
  color: var(--color-papel-secundario);
  font-size: 0.8rem;
  font-weight: 680;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.codigo strong {
  color: var(--color-acento);
  font-size: clamp(4rem, 14vw, 9rem);
  font-variant-numeric: tabular-nums;
  font-weight: 780;
  letter-spacing: 0.08em;
  line-height: 1;
}

.boton--acento {
  margin-top: 1.75rem;
  background: var(--color-acento);
  color: var(--color-tinta);
}

.confirmacion {
  min-height: 1.5rem;
  margin: 0.75rem 0 0;
  color: var(--color-papel-secundario);
  font-size: 0.85rem;
}

@media (hover: hover) and (pointer: fine) {
  .salir:hover {
    color: var(--color-papel);
  }

  .boton--acento:hover:not(:disabled) {
    background: var(--color-acento-activo);
  }
}

@media (max-width: 500px) {
  .lobby {
    padding-inline: 1.25rem;
  }

  .lobby__contenido {
    margin-top: 5rem;
  }

  .codigo strong {
    font-size: clamp(3.5rem, 20vw, 5.5rem);
  }
}
</style>
