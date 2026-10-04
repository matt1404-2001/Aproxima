<script setup>
import { computed, nextTick, ref, watch } from 'vue'

// Las props reciben el estado de la ronda y emit comunica el envío a la vista.
const props = defineProps({
  unidad: { type: String, required: true },
  respondio: { type: Boolean, default: false },
  estimacionRegistrada: { type: Number, default: null },
  enviando: { type: Boolean, default: false },
  deshabilitado: { type: Boolean, default: false },
  textoDeshabilitado: { type: String, default: 'Tiempo finalizado' },
  mensajeError: { type: String, default: '' },
})

const emit = defineEmits(['enviar'])
const valor = ref('')
const errorLocal = ref('')
const errorServidorOculto = ref(false)
const confirmacion = ref(null)
const mensajeCampo = computed(
  () => errorLocal.value || (errorServidorOculto.value ? '' : props.mensajeError),
)

watch(valor, () => {
  if (errorLocal.value) errorLocal.value = ''
  errorServidorOculto.value = true
})

watch(
  () => props.mensajeError,
  () => (errorServidorOculto.value = false),
)

watch(
  () => props.respondio,
  async (respondio, respondioAntes) => {
    if (!respondio || respondioAntes) return
    // nextTick espera a que Vue muestre la confirmación antes de mover el foco.
    await nextTick()
    confirmacion.value?.focus()
  },
)

function enviar() {
  // La validación ocurre aquí; la vista padre se encarga de llamar a la API.
  const normalizado = valor.value.trim()

  if (!normalizado) {
    errorLocal.value = 'Ingresa una estimación antes de continuar.'
    return
  }

  if (!/^[1-9]\d*$/.test(normalizado)) {
    errorLocal.value = 'La estimación debe ser un número entero mayor que cero.'
    return
  }

  const numero = Number(normalizado)
  if (!Number.isSafeInteger(numero)) {
    errorLocal.value = 'La estimación supera el valor máximo permitido.'
    return
  }

  emit('enviar', numero)
}
</script>

<template>
  <section
    class="respuesta"
    aria-labelledby="titulo-respuesta"
  >
    <div
      v-if="respondio"
      ref="confirmacion"
      class="confirmacion"
      role="status"
      tabindex="-1"
    >
      <p
        class="confirmacion__marca"
        aria-hidden="true"
      >
        OK
      </p>
      <h2 id="titulo-respuesta">
        Estimación registrada
      </h2>
      <p
        v-if="estimacionRegistrada !== null"
        class="estimacion-confirmada"
      >
        {{ estimacionRegistrada.toLocaleString('es-CR') }} <span>{{ unidad }}</span>
      </p>
      <p class="respuesta__ayuda">
        Tu respuesta es definitiva. Espera los resultados de la ronda.
      </p>
    </div>

    <!-- @submit.prevent evita la recarga y ejecuta la función enviar del componente. -->
    <form
      v-else
      novalidate
      @submit.prevent="enviar"
    >
      <h2 id="titulo-respuesta">
        Haz tu estimación
      </h2>
      <p class="respuesta__ayuda">
        Una vez enviada, no podrás cambiarla.
      </p>

      <label for="estimacion">Tu respuesta en {{ unidad }}</label>
      <div class="campo">
        <input
          id="estimacion"
          v-model="valor"
          name="estimacion"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="Ej. 40 000"
          :disabled="enviando || deshabilitado"
          :aria-invalid="Boolean(mensajeCampo)"
          :aria-describedby="mensajeCampo ? 'error-estimacion' : 'ayuda-estimacion'"
        >
        <span>{{ unidad }}</span>
      </div>
      <p
        id="ayuda-estimacion"
        class="limite"
      >
        Solo números enteros positivos.
      </p>
      <p
        v-if="mensajeCampo"
        id="error-estimacion"
        class="error"
        role="alert"
      >
        {{ mensajeCampo }}
      </p>

      <button
        class="boton boton--enviar"
        type="submit"
        :disabled="enviando || deshabilitado"
        :aria-busy="enviando"
      >
        {{ enviando ? 'Registrando…' : deshabilitado ? textoDeshabilitado : 'Enviar estimación' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.respuesta {
  border-radius: 1rem;
  padding: clamp(1.4rem, 3vw, 2rem);
  background: var(--color-papel);
  color: var(--color-tinta);
}

h2 {
  margin: 0;
  font-size: clamp(1.55rem, 3vw, 2.15rem);
  letter-spacing: -0.035em;
  line-height: 1;
}

.respuesta__ayuda {
  margin: 0.75rem 0 1.75rem;
  color: var(--color-texto-suave);
  line-height: 1.5;
}

label {
  display: block;
  margin-bottom: 0.55rem;
  font-size: 0.82rem;
  font-weight: 720;
}

.campo {
  display: flex;
  align-items: center;
  border: 2px solid var(--color-tinta);
  border-radius: var(--radio-control);
  background: #fff;
  overflow: hidden;
}

.campo:focus-within {
  outline: 3px solid var(--color-acento-activo);
  outline-offset: 3px;
}

.campo input {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  border: 0;
  outline: 0;
  padding: 1rem;
  background: transparent;
  color: var(--color-tinta);
  font-size: 1.25rem;
  font-weight: 720;
}

.campo span {
  flex: 0 0 auto;
  max-width: 9rem;
  padding: 0 1rem;
  color: var(--color-texto-suave);
  font-size: 0.86rem;
  font-weight: 720;
  white-space: nowrap;
}

.campo input:disabled {
  cursor: not-allowed;
}

.limite,
.error {
  margin: 0.55rem 0 0;
  font-size: 0.8rem;
}

.limite {
  color: var(--color-texto-suave);
}

.error {
  color: var(--color-error);
  font-weight: 680;
}

.boton--enviar {
  width: 100%;
  margin-top: 1.5rem;
  background: var(--color-acento);
  color: var(--color-tinta);
}

.confirmacion__marca {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  margin: 0 0 1.5rem;
  border-radius: 50%;
  background: var(--color-exito);
  color: #fff;
  font-size: 1.4rem;
  font-weight: 800;
}

.estimacion-confirmada {
  margin: 1.6rem 0 0;
  font-size: clamp(2.3rem, 6vw, 4rem);
  font-weight: 780;
  letter-spacing: -0.045em;
  line-height: 1;
  overflow-wrap: anywhere;
}

.estimacion-confirmada span {
  color: var(--color-texto-suave);
  font-size: 0.35em;
  letter-spacing: 0;
}

@media (hover: hover) and (pointer: fine) {
  .boton--enviar:hover:not(:disabled) {
    background: var(--color-acento-activo);
  }
}
</style>
