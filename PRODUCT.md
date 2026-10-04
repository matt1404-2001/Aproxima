# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue 3 con Vite, JavaScript, Composition API, Vue Router, `fetch` y CSS nativo. La aplicación se publica como sitio estático en Plesk y consume la API REST desplegada del proyecto.

## Users

- Estudiantes que ingresan desde un teléfono mediante un código de sala y participan con un alias temporal.
- Un anfitrión que crea y controla la partida desde una computadora, frecuentemente conectada a una pantalla proyectada.
- Docentes y compañeros que deben poder seguir y explicar la implementación de Vue durante una exposición académica.

## Product Purpose

Estimate Arena permite jugar cinco rondas de estimaciones numéricas sin cuentas. El anfitrión crea una sala, los jugadores ingresan por código, todos envían una única estimación y el servidor calcula resultados y ranking. El producto tiene éxito cuando una partida completa se entiende y se juega sin instrucciones externas.

## Positioning

No es una trivia de opciones: cada desafío exige estimar una cantidad. La cercanía numérica determina una puntuación calculada exclusivamente por el servidor.

## Operating Context

La experiencia combina teléfonos personales, una vista de anfitrión proyectada, rondas de treinta segundos y conectividad que puede interrumpirse. La API REST y el polling son la fuente de sincronización; no existen WebSockets ni cuentas de usuario.

## Capabilities and Constraints

- Cinco rondas, de dos a cuarenta jugadores y una estimación entera positiva por jugador y ronda.
- Estados oficiales: `LOBBY`, `RONDA_ACTIVA`, `RESULTADOS` y `FINALIZADA`.
- El servidor controla tiempo, autorización, cierre, puntuación, estadísticas y ranking.
- El cliente conserva únicamente la sesión necesaria y nunca expone tokens en rutas o interfaz.
- Debe funcionar desde 360 px, en navegadores modernos y en una pantalla proyectada.
- La implementación debe favorecer claridad didáctica sobre abstracciones sofisticadas.

## Brand Commitments

El nombre confirmado es Estimate Arena. La dirección visual aprobada para el frontend es una arena editorial: competitiva y contundente, pero clara, accesible y distinta de una copia visual de Kahoot.

## Evidence on Hand

- Requisitos aprobados en `docs/requisitos.md`.
- Casos de uso CU-01 a CU-13 en `docs/casos-de-uso/`.
- Contrato HTTP en `contracts/openapi.yaml`.
- API publicada en `https://tiusr30pl.cuc-carrera-ti.ac.cr/juego/api/v1`.
- No existen logotipo, fotografías, ilustraciones ni tipografías de marca previas.

## Product Principles

- El estado del juego siempre debe ser evidente.
- Responder debe requerir el mínimo de atención fuera de la pregunta.
- La vista móvil y la vista proyectada comparten lenguaje, pero priorizan contextos distintos.
- Una falla temporal nunca debe borrar una identidad o respuesta confirmada.
- La interfaz demuestra Vue con código directo y responsabilidades visibles.

## Accessibility & Inclusion

Formularios utilizables con teclado, foco visible, contraste suficiente, mensajes que no dependan solo del color, áreas táctiles cómodas y movimiento reducido cuando el sistema lo solicite.
