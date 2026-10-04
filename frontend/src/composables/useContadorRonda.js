import { onUnmounted, ref, watch } from 'vue'

export function useContadorRonda(ronda, servidorAhora, latenciaEstimadaMs) {
  const segundosRestantes = ref(0)
  let baseOficialMs = 0
  let baseMonotonaMs = 0
  let temporizador = null

  function actualizar() {
    const finalizaEnMs = Date.parse(ronda.value?.finalizaEn || '')
    if (!Number.isFinite(finalizaEnMs)) {
      segundosRestantes.value = 0
      return
    }

    const ahoraOficialMs = baseOficialMs + (performance.now() - baseMonotonaMs)
    segundosRestantes.value = Math.max(0, Math.ceil((finalizaEnMs - ahoraOficialMs) / 1000))
    if (segundosRestantes.value === 0) window.clearInterval(temporizador)
  }

  function sincronizar() {
    const servidorAhoraMs = Date.parse(servidorAhora.value || '')
    baseOficialMs = Number.isFinite(servidorAhoraMs)
      ? servidorAhoraMs + (latenciaEstimadaMs?.value || 0)
      : Date.now()
    baseMonotonaMs = performance.now()
    actualizar()

    window.clearInterval(temporizador)
    if (segundosRestantes.value > 0) {
      temporizador = window.setInterval(actualizar, 250)
    }
  }

  // watch resincroniza el contador cuando llega una nueva hora oficial del servidor.
  watch([ronda, servidorAhora, ...(latenciaEstimadaMs ? [latenciaEstimadaMs] : [])], sincronizar, {
    immediate: true,
  })
  onUnmounted(() => window.clearInterval(temporizador))

  return { segundosRestantes }
}
