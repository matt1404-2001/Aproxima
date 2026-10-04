const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://tiusr30pl.cuc-carrera-ti.ac.cr/juego/api/v1'
).replace(/\/$/, '')

export class ErrorApi extends Error {
  constructor({ codigo, mensaje, detalles = [], estadoActual, rondaActualId, status }) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.codigo = codigo
    this.detalles = detalles
    this.estadoActual = estadoActual
    this.rondaActualId = rondaActualId
    this.status = status
  }
}

export class ErrorComunicacion extends Error {
  constructor() {
    super('No fue posible comunicarse con el servidor. Inténtalo nuevamente.')
    this.name = 'ErrorComunicacion'
    this.codigo = 'ERROR_COMUNICACION'
  }
}

export async function solicitar(ruta, { metodo = 'GET', cuerpo, token, signal } = {}) {
  const encabezados = { Accept: 'application/json' }

  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json'
  if (token) encabezados.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${apiBaseUrl}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ErrorComunicacion()
  }

  const contenido = await leerJson(respuesta)
  if (!respuesta.ok) {
    throw new ErrorApi({
      codigo: contenido?.codigo || 'RESPUESTA_NO_VALIDA',
      mensaje: contenido?.mensaje || 'No fue posible completar la operación.',
      detalles: contenido?.detalles,
      estadoActual: contenido?.estadoActual,
      rondaActualId: contenido?.rondaActualId,
      status: respuesta.status,
    })
  }

  return contenido
}

async function leerJson(respuesta) {
  const tipoContenido = respuesta.headers.get('content-type') || ''
  if (!tipoContenido.includes('application/json')) return null

  try {
    return await respuesta.json()
  } catch {
    return null
  }
}
