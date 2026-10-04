export function rutaParaEstado(estadoPartida) {
  const partidaId = estadoPartida.partidaId

  if (estadoPartida.estado === 'LOBBY') {
    return { name: 'lobby', params: { partidaId } }
  }

  if (estadoPartida.estado === 'RONDA_ACTIVA') {
    return {
      name: 'ronda',
      params: { partidaId, rondaId: estadoPartida.ronda.rondaId },
    }
  }

  if (estadoPartida.estado === 'RESULTADOS') {
    return {
      name: 'resultados',
      params: { partidaId, rondaId: estadoPartida.resultados.rondaId },
    }
  }

  return { name: 'ranking', params: { partidaId } }
}

export function rutaConEstado(estadoPartida, datosNavegacion = {}) {
  return {
    ...rutaParaEstado(estadoPartida),
    state: { estadoPartida, ...datosNavegacion },
  }
}

export function redireccionPorSesion(destino, sesion) {
  if (!destino.meta.requiereSesion) return undefined
  if (!sesion) return { name: 'inicio' }

  if (
    destino.params.partidaId &&
    String(destino.params.partidaId) !== String(sesion.partidaId)
  ) {
    return { name: 'lobby', params: { partidaId: sesion.partidaId } }
  }

  return undefined
}
