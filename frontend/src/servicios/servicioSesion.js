const claveSesion = 'estimate-arena:sesion'
let sesionTemporal = null

export function guardarSesion(sesion) {
  const datos = {
    partidaId: sesion.partidaId,
    codigo: sesion.codigo,
    rol: sesion.rol,
    token: sesion.token,
    jugador: sesion.jugador,
  }
  sesionTemporal = { ...datos, persistente: false }

  try {
    localStorage.setItem(claveSesion, JSON.stringify(datos))
    sesionTemporal = { ...datos, persistente: true }
    return true
  } catch {
    return false
  }
}

export function obtenerSesion() {
  try {
    const valor = localStorage.getItem(claveSesion)
    if (!valor) return sesionTemporal
    const sesion = JSON.parse(valor)
    if (!sesion.partidaId || !sesion.rol || !sesion.token) {
      eliminarSesion()
      return sesionTemporal
    }

    return { ...sesion, persistente: true }
  } catch {
    return sesionTemporal
  }
}

export function eliminarSesion() {
  sesionTemporal = null
  try {
    localStorage.removeItem(claveSesion)
  } catch {
    // La sesión ya no puede utilizarse si el almacenamiento dejó de estar disponible.
  }
}

export function almacenamientoDisponible() {
  const clavePrueba = `${claveSesion}:prueba`
  try {
    localStorage.setItem(clavePrueba, '1')
    localStorage.removeItem(clavePrueba)
    return true
  } catch {
    return false
  }
}
