<script setup>
import { computed, onMounted, ref } from 'vue'

// Las props permiten que la vista padre controle el estado de carga y los errores de la API.
defineProps({
  pendiente: {
    type: Boolean,
    default: false,
  },
  errorExterno: {
    type: String,
    default: '',
  },
})

// Los eventos comunican las acciones del formulario sin acoplarlo a la API ni al router.
const emit = defineEmits(['enviar', 'cancelar'])

const codigo = ref('')
const nombre = ref('')
const enviado = ref(false)
const campoCodigo = ref(null)

// computed normaliza los campos sin guardar una segunda copia de su estado.
const codigoNormalizado = computed(() => codigo.value.trim().toUpperCase())
const nombreNormalizado = computed(() => nombre.value.trim())

const errorCodigo = computed(() => {
  if (!enviado.value) return ''
  if (!codigoNormalizado.value) return 'Escribe el código de la partida.'
  if (!/^[A-Z0-9]{5}$/.test(codigoNormalizado.value)) {
    return 'El código debe tener cinco letras o números.'
  }
  return ''
})

const errorNombre = computed(() => {
  if (!enviado.value) return ''
  if (!nombreNormalizado.value) return 'Escribe el nombre que usarás en la partida.'
  const longitudVisible = Array.from(nombreNormalizado.value).length
  if (longitudVisible < 2 || longitudVisible > 20) {
    return 'El nombre debe tener entre 2 y 20 caracteres.'
  }
  return ''
})

onMounted(() => campoCodigo.value?.focus())

// Este evento normaliza el código mientras el usuario escribe.
function actualizarCodigo(evento) {
  codigo.value = evento.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function enviar() {
  // El componente valida y luego entrega los datos limpios a InicioVista.
  enviado.value = true
  if (errorCodigo.value || errorNombre.value) return

  emit('enviar', {
    codigo: codigoNormalizado.value,
    nombre: nombreNormalizado.value,
  })
}
</script>

<template>
  <form
    class="formulario-ingreso"
    novalidate
    :aria-busy="pendiente"
    @submit.prevent="enviar"
  >
    <div class="campo">
      <label for="codigo-partida">Código de partida</label>
      <input
        id="codigo-partida"
        ref="campoCodigo"
        :value="codigo"
        name="codigo"
        type="text"
        inputmode="text"
        autocomplete="one-time-code"
        autocapitalize="characters"
        spellcheck="false"
        maxlength="5"
        placeholder="ABCDE"
        :disabled="pendiente"
        :aria-invalid="Boolean(errorCodigo)"
        :aria-describedby="errorCodigo ? 'error-codigo' : 'ayuda-codigo'"
        @input="actualizarCodigo"
      >
      <p
        v-if="errorCodigo"
        id="error-codigo"
        class="campo__error"
      >
        {{ errorCodigo }}
      </p>
      <p
        v-else
        id="ayuda-codigo"
        class="campo__ayuda"
      >
        Son los cinco caracteres que comparte el anfitrión.
      </p>
    </div>

    <div class="campo">
      <label for="nombre-jugador">Tu nombre</label>
      <!-- v-model mantiene el campo sincronizado con la ref nombre. -->
      <input
        id="nombre-jugador"
        v-model="nombre"
        name="nombre"
        type="text"
        autocomplete="nickname"
        maxlength="20"
        placeholder="Por ejemplo, María"
        :disabled="pendiente"
        :aria-invalid="Boolean(errorNombre)"
        :aria-describedby="errorNombre ? 'error-nombre' : 'ayuda-nombre'"
      >
      <p
        v-if="errorNombre"
        id="error-nombre"
        class="campo__error"
      >
        {{ errorNombre }}
      </p>
      <p
        v-else
        id="ayuda-nombre"
        class="campo__ayuda"
      >
        Usa entre 2 y 20 caracteres. No necesitas una cuenta.
      </p>
    </div>

    <p
      v-if="errorExterno"
      class="mensaje-error"
      role="alert"
    >
      {{ errorExterno }}
    </p>

    <div class="formulario-ingreso__acciones">
      <button
        class="boton boton--principal"
        type="submit"
        :disabled="pendiente"
      >
        {{ pendiente ? 'Ingresando…' : 'Entrar a la arena' }}
      </button>
      <button
        class="boton boton--texto"
        type="button"
        :disabled="pendiente"
        @click="emit('cancelar')"
      >
        Volver
      </button>
    </div>
  </form>
</template>

<style scoped>
.formulario-ingreso {
  display: grid;
  gap: 1.35rem;
  margin-top: 2rem;
}

.campo {
  display: grid;
  gap: 0.5rem;
}

.campo label {
  font-size: 0.9rem;
  font-weight: 720;
}

.campo input {
  width: 100%;
  min-height: 3.5rem;
  border: 1px solid var(--color-linea);
  border-radius: var(--radio-control);
  padding: 0.8rem 0.95rem;
  background: color-mix(in srgb, var(--color-papel) 80%, white);
  color: var(--color-tinta);
  font-size: 1rem;
  transition:
    border-color var(--duracion-rapida) ease,
    background-color var(--duracion-rapida) ease;
}

.campo input::placeholder {
  color: #707368;
}

.campo input:focus {
  border-color: var(--color-tinta);
  background: #fffef8;
}

.campo input:disabled {
  cursor: wait;
  opacity: 0.65;
}

.campo input[aria-invalid='true'] {
  border-color: var(--color-error);
}

.campo__ayuda,
.campo__error {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
}

.campo__ayuda {
  color: var(--color-texto-suave);
}

.campo__error {
  color: var(--color-error);
  font-weight: 620;
}

.mensaje-error {
  margin: 0;
  border-top: 1px solid var(--color-error);
  padding-top: 0.9rem;
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 620;
  line-height: 1.45;
}

.formulario-ingreso__acciones {
  display: grid;
  gap: 0.55rem;
}

.boton--texto {
  min-height: 2.8rem;
  background: transparent;
  color: var(--color-texto-suave);
}

@media (hover: hover) and (pointer: fine) {
  .boton--texto:hover:not(:disabled) {
    color: var(--color-tinta);
  }
}
</style>
