# Estimate Arena

Juego web universitario de estimaciones numéricas. El backend expondrá una API REST y el frontend se desarrollará con Vue.js.

## Estructura

- `docs/requisitos.md`: requisitos funcionales, no funcionales y decisiones aprobadas.
- `docs/casos-de-uso/`: casos de uso del sistema.
- `contracts/`: contrato OpenAPI que se diseñará antes de implementar la API.
- `database/`: esquema y migraciones.
- `backend/`: implementación de la API.
- `frontend/`: aplicación Vue.js.

## Orden de desarrollo

1. Revisar requisitos y casos de uso.
2. Diseñar y aprobar `contracts/openapi.yaml`.
3. Implementar y probar el backend contra el contrato.
4. Implementar el frontend consumiendo la API.
5. Ejecutar pruebas de integración y aceptación.
