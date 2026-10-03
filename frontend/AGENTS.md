# Instrucciones del frontend

## Alcance

Trabaja en `frontend/` y en sus pruebas. No modifiques `backend/`, `database/` ni el contrato sin autorización explícita.

## Especificaciones

Consulta los casos de uso, los requisitos de interfaz aplicables y `contracts/openapi.yaml`. Consume solamente las operaciones y estructuras definidas por el contrato aprobado.

## Límites del cliente

- El contador del navegador es informativo; el servidor decide si una respuesta llegó a tiempo.
- El frontend no calcula la puntuación oficial.
- El frontend no decide el cierre oficial de una ronda.
- El frontend no sustituye las validaciones ni los permisos del servidor.
- Los errores de la API deben presentarse al usuario sin inventar resultados locales.

