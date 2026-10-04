import { ErrorApi, solicitar } from './clienteHttp'

const mensajesPorCodigo = {
  DESAFIOS_INSUFICIENTES: 'No hay suficientes desafíos disponibles para crear la partida.',
  PARTIDA_NO_ENCONTRADA: 'No encontramos una partida con ese código.',
  PARTIDA_NO_DISPONIBLE: 'La partida ya comenzó o finalizó y no admite nuevos jugadores.',
  PARTIDA_LLENA: 'La partida alcanzó el máximo de jugadores.',
  NOMBRE_OCUPADO: 'Ese nombre ya está en uso. Elige otro.',
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
