const claveSesion = 'estimate-arena:sesion'

export function guardarSesion(sesion) {
  const datos = {
    partidaId: sesion.partidaId,
    rol: sesion.rol,
    token: sesion.token,
  }

  localStorage.setItem(claveSesion, JSON.stringify(datos))
}

export function obtenerSesion() {
  const valor = localStorage.getItem(claveSesion)
  if (!valor) return null

  try {
    const sesion = JSON.parse(valor)
    if (!sesion.partidaId || !sesion.rol || !sesion.token) {
      eliminarSesion()
      return null
    }

    return sesion
  } catch {
    eliminarSesion()
    return null
  }
}

export function eliminarSesion() {
  localStorage.removeItem(claveSesion)
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
