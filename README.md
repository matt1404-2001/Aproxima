# Estimate Arena

Estimate Arena es un juego web multijugador de estimaciones numéricas desarrollado como proyecto universitario para demostrar el uso de Vue.js 3 en una aplicación completa.

Los participantes ingresan a una sala mediante un código y un nombre, sin crear una cuenta. En cada ronda reciben una pregunta cuya respuesta es un valor numérico y disponen de 30 segundos para enviar una única estimación. Al cerrar la ronda, el sistema presenta la respuesta correcta, las estadísticas del grupo, los puntos obtenidos y la clasificación acumulada.

## Funcionamiento

1. El anfitrión crea una partida y comparte el código generado.
2. Entre 2 y 40 jugadores ingresan al lobby con un nombre único.
3. El anfitrión inicia una partida de cinco rondas.
4. Cada jugador envía una estimación numérica por ronda.
5. La ronda termina al agotarse el tiempo o cuando todos respondieron.
6. El anfitrión revisa los resultados y decide cuándo continuar.
7. Después de la quinta ronda se muestra la clasificación final.

El servidor controla el tiempo, valida las respuestas y calcula la puntuación. El frontend consulta periódicamente el estado mediante una API REST, sin utilizar WebSockets.

## Características principales

- Partidas sin registro de usuarios.
- Código público de sala y credenciales privadas de sesión.
- Recuperación de la partida después de recargar el navegador.
- Lobby actualizado mediante polling.
- Rondas sincronizadas con la hora oficial del servidor.
- Una estimación definitiva por jugador y ronda.
- Resultados individuales y estadísticas generales.
- Ranking provisional y final con manejo de empates.
- Interfaz adaptable para teléfonos, computadoras y proyección en clase.

## Tecnologías

### Frontend

- Vue.js 3 con Composition API y componentes `.vue`.
- Vue Router.
- Vite.
- JavaScript y CSS.
- Vitest y Vue Test Utils.

### Backend

- ASP.NET Core 8.
- Entity Framework Core.
- MariaDB.
- API REST con autenticación mediante tokens de sesión.
- Arquitectura separada en dominio, aplicación, infraestructura y API.

## Estructura del repositorio

```text
backend/              API y pruebas de .NET
contracts/            contrato OpenAPI
database/             esquema y scripts de MariaDB
docs/                 requisitos y casos de uso
frontend/             aplicación Vue 3 y pruebas
```

## API

La API publicada utiliza la siguiente dirección base:

```text
https://tiusr30pl.cuc-carrera-ti.ac.cr/juego/api/v1
```

El contrato completo de operaciones, solicitudes, respuestas y errores se encuentra en [`contracts/openapi.yaml`](contracts/openapi.yaml).

## Ejecución local

### Requisitos

- .NET SDK 8.
- Node.js compatible con Vite 7.
- MariaDB 10.6 o posterior.

### Base de datos

1. Crea una base de datos de MariaDB.
2. Ejecuta el script [`database/base_datos_estimate_arena.sql`](database/base_datos_estimate_arena.sql).
3. Configura la cadena `ConnectionStrings:EstimateArena` mediante variables de entorno o configuración local de ASP.NET Core.

### Backend

Desde la raíz del repositorio:

```bash
dotnet restore backend/EstimateArena.sln
dotnet run --project backend/src/EstimateArena.Api
```

En el perfil de desarrollo, la API se inicia de forma predeterminada en `http://localhost:5199`.

### Frontend

```bash
cd frontend
npm install
```

Copia `.env.example` como `.env` y ajusta `VITE_API_BASE_URL` si utilizarás una API local. Después ejecuta:

```bash
npm run dev
```

Vite inicia normalmente el frontend en `http://localhost:5173`.

## Pruebas

Backend:

```bash
dotnet test backend/EstimateArena.sln
```

Frontend:

```bash
cd frontend
npm run lint
npm test
npm run build
```

## Documentación

- [Requisitos funcionales y no funcionales](docs/requisitos.md)
- [Casos de uso](docs/casos-de-uso/)
- [Contrato OpenAPI](contracts/openapi.yaml)
- [Diseño inicial de la base de datos](database/base_datos_estimate_arena.sql)

## Alcance académico


