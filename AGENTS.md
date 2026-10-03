# Estimate Arena

Proyecto académico de juego web de estimaciones, con una API y un frontend en Vue.js.

## Fuentes de verdad

- `docs/requisitos.md`: alcance, requisitos y reglas aprobadas.
- `docs/casos-de-uso/`: comportamiento funcional de extremo a extremo.
- `contracts/openapi.yaml`: contrato HTTP, cuando sea aprobado.
- `database/`: esquema y migraciones de la base de datos.

Si dos documentos se contradicen, no elijas uno silenciosamente. Informa la contradicción y propone el cambio mínimo antes de implementar la parte afectada.

## Reglas de trabajo

- Antes de trabajar en `backend/`, lee y aplica `backend/AGENTS.md`.
- Antes de trabajar en `frontend/`, lee y aplica `frontend/AGENTS.md`.
- Trabaja solamente en el módulo solicitado.
- Conserva los identificadores de requisitos y casos de uso para mantener la trazabilidad.
- No agregues funcionalidades que no estén aprobadas en los requisitos.
- No introduzcas WebSockets, cuentas de usuario, OAuth, chat, microservicios ni otras ampliaciones fuera del alcance.
- No modifiques `contracts/openapi.yaml` salvo que la tarea autorice explícitamente cambiar el contrato.
- Implementa primero el backend aprobado y después el frontend que consume el contrato.
- Verifica los cambios con las pruebas correspondientes al módulo trabajado.
