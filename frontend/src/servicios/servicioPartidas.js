import { ErrorApi, solicitar } from './clienteHttp'

const mensajesPorCodigo = {
  DESAFIOS_INSUFICIENTES: 'No hay suficientes desafíos disponibles para crear la partida.',
  PARTIDA_NO_ENCONTRADA: 'No encontramos una partida con ese código.',
  PARTIDA_NO_DISPONIBLE: 'La partida ya comenzó o finalizó y no admite nuevos jugadores.',
  PARTIDA_LLENA: 'La partida alcanzó el máximo de jugadores.',
  NOMBRE_OCUPADO: 'Ese nombre ya está en uso. Elige otro.',
  CREDENCIAL_INVALIDA: 'No fue posible recuperar la sesión.',
  ACCESO_DENEGADO: 'No tienes autorización para realizar esta acción.',
  JUGADORES_INSUFICIENTES: 'Se necesitan al menos 2 jugadores para iniciar.',
  ESTADO_PARTIDA_INCOMPATIBLE: 'La partida cambió de estado. Actualizando la pantalla.',
  DATOS_INVALIDOS: 'Revisa la estimación e inténtalo nuevamente.',
  RONDA_CERRADA: 'El tiempo terminó. Tu estimación no fue registrada.',
  RONDA_NO_VIGENTE: 'La ronda cambió. Actualizando la información.',
  ESTIMACION_DUPLICADA: 'Ya enviaste una estimación para esta ronda.',
  RESULTADOS_NO_DISPONIBLES: 'Los resultados todavía están siendo preparados.',
  RANKING_NO_DISPONIBLE: 'La clasificación todavía no está disponible.',
  SIN_RONDAS_PENDIENTES: 'No quedan más rondas. Puedes finalizar la partida.',
  RONDAS_PENDIENTES: 'Todavía quedan rondas por jugar.',
  LIMITE_SOLICITUDES: 'Se realizaron demasiados intentos. Espera un momento y vuelve a probar.',
  SERVICIO_NO_DISPONIBLE: 'El servicio no está disponible en este momento. Inténtalo nuevamente.',
}

export function crearPartida() {
  return solicitarPartida('/partidas', { metodo: 'POST' })
}

export function ingresarJugador(codigo, nombre) {
  const codigoNormalizado = codigo.trim().toUpperCase()
  return solicitarPartida(`/partidas/codigo/${encodeURIComponent(codigoNormalizado)}/jugadores`, {
    metodo: 'POST',
    cuerpo: { nombre: nombre.trim() },
  })
}

export function recuperarSesion(partidaId, token) {
  return solicitarPartida(`/partidas/${partidaId}/sesion`, { token })
}

export function consultarEstadoPartida(partidaId, token, signal) {
  return solicitarPartida(`/partidas/${partidaId}/estado`, { token, signal })
}

export function iniciarPartida(partidaId, token) {
  return solicitarPartida(`/partidas/${partidaId}/iniciar`, {
    metodo: 'POST',
    token,
  })
}

export function enviarEstimacion(partidaId, rondaId, token, valor, signal) {
  return solicitarPartida(`/partidas/${partidaId}/rondas/${rondaId}/estimaciones`, {
    metodo: 'POST',
    token,
    cuerpo: { valor },
    signal,
  })
}

export function consultarResultadosRonda(partidaId, rondaId, token, signal) {
  return solicitarPartida(`/partidas/${partidaId}/rondas/${rondaId}/resultados`, {
    token,
    signal,
  })
}

export function consultarRanking(partidaId, token, signal) {
  return solicitarPartida(`/partidas/${partidaId}/ranking`, { token, signal })
}

export function avanzarRonda(partidaId, rondaId, token, signal) {
  return solicitarPartida(`/partidas/${partidaId}/rondas/${rondaId}/avanzar`, {
    metodo: 'POST',
    token,
    signal,
  })
}

export function finalizarPartida(partidaId, rondaId, token, signal) {
  return solicitarPartida(`/partidas/${partidaId}/finalizar`, {
    metodo: 'POST',
    token,
    cuerpo: { rondaId },
    signal,
  })
}

export function esErrorSesionDefinitivo(error, { accesoDenegadoEsDefinitivo = false } = {}) {
  return (
    error instanceof ErrorApi &&
    (['CREDENCIAL_INVALIDA', 'PARTIDA_NO_ENCONTRADA'].includes(error.codigo) ||
      [401, 404].includes(error.status) ||
      (accesoDenegadoEsDefinitivo &&
        (error.codigo === 'ACCESO_DENEGADO' || error.status === 403)))
  )
}

async function solicitarPartida(ruta, opciones) {
  try {
    return await solicitar(ruta, opciones)
  } catch (error) {
    if (error instanceof ErrorApi && mensajesPorCodigo[error.codigo]) {
      error.message = mensajesPorCodigo[error.codigo]
    }
    throw error
  }
}
