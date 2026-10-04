import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

import {
  consultarEstadoPartida,
  esErrorSesionDefinitivo,
} from '../servicios/servicioPartidas'

const intervaloPredeterminado = 2000

export function useEstadoPartida(sesion, { alActualizar } = {}) {
  const estadoPartida = shallowRef(null)
  const cargando = ref(true)
  const desconectado = ref(false)
  const sesionInvalida = ref(false)
  const latenciaEstimadaMs = ref(0)

  let versionEstado = 0
  let temporizador = null
  let controlador = null
  let consultaEnCurso = false
  let detenido = false

  // La siguiente consulta se agenda al terminar para evitar solicitudes superpuestas.
  async function consultar() {
    if (detenido || consultaEnCurso) return

    consultaEnCurso = true
    controlador = new AbortController()
    const inicioConsulta = performance.now()
    let siguienteIntervalo = estadoPartida.value?.pollingSugeridoMs || intervaloPredeterminado

    try {
      const nuevoEstado = await consultarEstadoPartida(
        sesion.partidaId,
        sesion.token,
        controlador.signal,
      )
      latenciaEstimadaMs.value = Math.max(0, (performance.now() - inicioConsulta) / 2)

      // La versión impide que una respuesta antigua reemplace el estado más reciente.
      if (nuevoEstado.versionEstado >= versionEstado) {
        versionEstado = nuevoEstado.versionEstado
        estadoPartida.value = nuevoEstado
        alActualizar?.(nuevoEstado)
      }

      siguienteIntervalo = nuevoEstado.pollingSugeridoMs || intervaloPredeterminado
      desconectado.value = false
    } catch (error) {
      if (error?.name === 'AbortError') return

      if (esErrorSesionDefinitivo(error, { accesoDenegadoEsDefinitivo: true })) {
        sesionInvalida.value = true
        detener()
        return
      }

      desconectado.value = true
    } finally {
      consultaEnCurso = false
      controlador = null
      cargando.value = false

      if (!detenido) {
        temporizador = window.setTimeout(consultar, siguienteIntervalo)
      }
    }
  }

  function reintentar() {
    if (detenido || consultaEnCurso) return
    window.clearTimeout(temporizador)
    consultar()
  }

  function detener() {
    detenido = true
    window.clearTimeout(temporizador)
    controlador?.abort()
  }

  onMounted(consultar)
  onUnmounted(detener)

  return {
    estadoPartida,
    cargando,
    desconectado,
    sesionInvalida,
    latenciaEstimadaMs,
    reintentar,
    detener,
  }
}
