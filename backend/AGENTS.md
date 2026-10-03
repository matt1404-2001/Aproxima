# Backend de Estimate Arena

Estas instrucciones aplican a todo el trabajo dentro de `backend/`. Complementan el `AGENTS.md` de la raíz del proyecto.

## 1. Objetivo y límites

Implementa una única API REST modular para Estimate Arena con ASP.NET Core 8 y MariaDB. Mantén un alcance académico: código claro, comprobable y desplegable en Plesk, sin convertir el proyecto en una plataforma empresarial.

Trabaja únicamente en:

- `backend/`.
- `database/` cuando la tarea autorice cambios de persistencia o migraciones.
- Pruebas del backend.

No modifiques `frontend/`. Los pasos de interfaz descritos en los casos de uso son contexto funcional, no instrucciones para crear vistas, componentes, rutas ni estilos.

No agregues WebSockets, ASP.NET Core Identity, JWT, cuentas, OAuth, chat, microservicios, colas, CQRS, MediatR, repositorios genéricos, AutoMapper ni otras dependencias o patrones si la tarea y una necesidad concreta no los justifican.

## 2. Especificaciones obligatorias

Consulta estas fuentes mediante rutas relativas desde la raíz:

- Requisitos: `docs/requisitos.md`.
- Casos de uso: `docs/casos-de-uso/`.
- Contrato HTTP: `contracts/openapi.yaml`.
- Modelo SQL de referencia: `database/base_datos_estimate_arena.sql`.

Cada fuente tiene una responsabilidad distinta:

- Los requisitos y casos de uso definen el comportamiento y las reglas del negocio.
- `contracts/openapi.yaml` es la fuente de verdad para rutas, métodos, autenticación, cuerpos JSON, respuestas, códigos HTTP, códigos de error y nombres públicos.
- El SQL existente sirve para comprender tablas, relaciones, restricciones e índices. Está escrito para MySQL 8 y no debe ejecutarse ni copiarse sin revisar su compatibilidad con MariaDB.
- Las migraciones de EF Core aprobadas y probadas contra MariaDB serán la fuente ejecutable del esquema durante la implementación.
- El código existente no reemplaza a las especificaciones.

Si dos fuentes se contradicen, no elijas una silenciosamente ni programes una interpretación propia. Identifica los documentos y reglas afectados, explica el conflicto y propone el cambio mínimo antes de implementar esa parte.

El contrato OpenAPI está en estado `BORRADOR`. No modifiques `contracts/openapi.yaml` salvo que la tarea autorice explícitamente cambiar el contrato. Si la implementación requiere otro campo, endpoint, estado o error, presenta primero la propuesta de cambio.

No implementes una fórmula de puntuación ni la numeración posterior a empates mientras continúen registradas como decisiones pendientes en OpenAPI y en los requisitos. Puedes avanzar en módulos que no dependan de esas decisiones.

## 3. Revisión al comenzar una sesión

Realiza esta revisión una vez al comenzar una nueva sesión de backend, después de una compactación importante de contexto o al recibir un trabajo de otro agente:

1. Lee el `AGENTS.md` de la raíz y este archivo.
2. Revisa el estado actual del repositorio y los cambios sin confirmar; no sobrescribas trabajo ajeno.
3. Identifica el módulo, los requisitos `RF` y los casos de uso `CU` afectados por la tarea.
4. Lee las secciones pertinentes de `docs/requisitos.md` y solamente los casos de uso relacionados.
5. Lee en `contracts/openapi.yaml` las operaciones, esquemas y errores relacionados.
6. Si la tarea toca persistencia, revisa las tablas y relaciones pertinentes del SQL de referencia y las migraciones existentes.
7. Inspecciona el código y las pruebas actuales antes de proponer cambios.
8. Confirma que no exista una decisión pendiente que impida implementar correctamente el módulo.

No es necesario releer los trece casos de uso en cada turno. Vuelve a consultar una fuente cuando cambie el módulo, exista una contradicción, el contexto pueda estar desactualizado o la tarea afecte una regla transversal como autenticación, tiempo, cierre de ronda o transiciones de estado.

## 4. Plataforma técnica

- Target framework: `net8.0`.
- Framework web: ASP.NET Core 8 Web API con controladores.
- Persistencia: Entity Framework Core 8.
- Proveedor: `Pomelo.EntityFrameworkCore.MySql` 8.x compatible con EF Core 8 y configurado para MariaDB.
- Base de datos: MariaDB con InnoDB y `utf8mb4`.
- Documentación HTTP: el archivo OpenAPI contractual existente; la documentación generada por la aplicación debe coincidir con él.
- Pruebas: framework de pruebas de .NET y `WebApplicationFactory` para integración cuando corresponda.

Mantén versiones mayores alineadas con .NET 8 y EF Core 8. No actualices el framework ni agregues paquetes de producción sin justificar la necesidad y comprobar su compatibilidad con el entorno Plesk.

## 5. Arquitectura limpia pragmática

Organiza la solución con estas responsabilidades:

```text
backend/
├── src/
│   ├── EstimateArena.Domain/
│   ├── EstimateArena.Application/
│   ├── EstimateArena.Infrastructure/
│   └── EstimateArena.Api/
└── tests/
    ├── EstimateArena.UnitTests/
    └── EstimateArena.IntegrationTests/
```

Dependencias permitidas:

```text
Domain          -> ninguna capa del sistema
Application     -> Domain
Infrastructure  -> Application + Domain
Api             -> Application + Infrastructure solo para composición y arranque
```

Responsabilidades:

- `Domain`: entidades, objetos de valor, estados, invariantes y reglas puras. No depende de EF Core, HTTP ni ASP.NET Core.
- `Application`: casos de uso, interfaces de persistencia y servicios, modelos de entrada/salida internos y coordinación de reglas.
- `Infrastructure`: `DbContext`, configuraciones Fluent API, migraciones, consultas, transacciones, hashing de tokens, reloj y adaptadores externos.
- `Api`: controladores delgados, autenticación, autorización, composición de dependencias, serialización y traducción uniforme de errores a HTTP.

Agrupa el código por capacidad de negocio cuando ayude a encontrarlo: `Partidas`, `Jugadores`, `Rondas`, `Estimaciones`, `Resultados` y `Ranking`.

La arquitectura limpia no exige una clase o interfaz por cada operación. Evita abstracciones ceremoniales. No envuelvas `DbSet` en un repositorio genérico; crea interfaces específicas solo cuando representen una necesidad real de la aplicación o una frontera de infraestructura.

## 6. Reglas de diseño y Clean Code

- Usa nombres del dominio en español de manera consistente: `Partida`, `Jugador`, `Ronda`, `Estimacion`. No mezcles sin motivo nombres como `Game` y `Partida`.
- Mantén activado nullable reference types.
- Prefiere clases y métodos pequeños con una responsabilidad clara, pero no fragmentes lógica simple en capas artificiales.
- Usa inyección de dependencias; evita estado global mutable y localizadores de servicios.
- No coloques reglas de negocio en controladores, configuraciones de EF Core ni middleware.
- No devuelvas entidades de EF Core directamente. Usa DTO explícitos alineados con OpenAPI.
- Haz mapeos explícitos mientras sean pequeños; no agregues AutoMapper por comodidad.
- Usa operaciones asíncronas para I/O y propaga `CancellationToken` desde HTTP hasta EF Core.
- No uses `.Result`, `.Wait()`, `async void` ni `Task.Run` para operaciones de base de datos.
- Elimina código muerto y duplicación real; no generalices antes de tener una necesidad concreta.
- Mantén las advertencias del compilador y del analizador en cero para el código nuevo o modificado.
- No cambies nombres públicos, esquemas JSON ni códigos de error solo para ajustarlos a preferencias internas de C#.

## 7. Cumplimiento de OpenAPI

- Implementa exactamente las rutas, métodos y códigos HTTP definidos en `contracts/openapi.yaml`.
- Usa `Authorization: Bearer <token>` para las operaciones protegidas.
- Conserva los nombres JSON en `camelCase` y los valores de estado exactamente como `LOBBY`, `RONDA_ACTIVA`, `RESULTADOS` y `FINALIZADA`.
- La consulta `GET /partidas/{partidaId}/estado` debe ser ligera, idempotente desde la perspectiva del cliente y apta para polling cada 2 segundos.
- Resultados y ranking se consultan en sus endpoints propios; no cargues información estática o colecciones innecesarias en cada polling.
- No expongas la respuesta correcta, explicación, fuente, diferencias ni puntos durante `RONDA_ACTIVA`.
- Configura el manejo automático de errores de validación de ASP.NET Core para que produzca el esquema `ErrorApi`; no permitas que aparezca un formato `ProblemDetails` distinto del contrato.
- Centraliza excepciones y errores esperados. Los conflictos de negocio deben producir los códigos `4xx` y códigos estables definidos; no los conviertas en `500`.
- Nunca devuelvas trazas, SQL, rutas internas, secretos ni detalles del proveedor de base de datos.
- La documentación generada en ejecución es una verificación de la implementación, no una fuente paralela que pueda divergir del archivo contractual.

## 8. Autenticación y seguridad

- No uses ASP.NET Core Identity ni JWT. Las sesiones son tokens opacos temporales sin cuentas de usuario.
- Implementa un esquema de autenticación Bearer propio que resuelva el token y produzca la identidad de `ANFITRION` o `JUGADOR`.
- Define políticas de autorización separadas para acciones del anfitrión y del jugador.
- Genera tokens con un generador criptográficamente seguro. Entrega el token original solo al crear la partida o ingresar como jugador.
- Guarda únicamente un hash criptográfico del token; nunca el token original.
- No incluyas tokens en URL, logs, excepciones, métricas, respuestas públicas ni datos del ranking.
- El código de sala es público y nunca funciona como autorización.
- Configura CORS mediante una lista de orígenes en configuración. No uses `AllowAnyOrigin` en producción.
- Usa el rate limiting integrado de ASP.NET Core para creación, ingreso y operaciones de control expuestas en el contrato.
- Trata los nombres como texto. No almacenes HTML y no dependas solamente del frontend para validarlos.
- Mantén secretos y cadenas de conexión fuera del repositorio. Usa Secret Manager en desarrollo y variables de entorno o configuración protegida de Plesk en producción.

## 9. Tiempo, concurrencia y consistencia

- Usa UTC en toda la aplicación y la base de datos.
- Usa `DateTimeOffset` en límites de aplicación y API. No uses `DateTime.Now`.
- Inyecta `TimeProvider` para consultar el tiempo y permitir pruebas deterministas.
- La aceptación de una estimación depende de la hora del servidor, nunca del contador del navegador.
- El cierre por tiempo o porque todos respondieron debe ser idempotente. Una consulta de estado puede materializar el cierre una sola vez.
- No uses bloqueos en memoria como garantía de consistencia; Plesk puede ejecutar más de un proceso o reiniciar la aplicación.
- Protege transiciones y cálculos con transacciones, restricciones únicas y actualizaciones condicionales verificando las filas afectadas.
- Conserva la restricción única de una estimación por jugador y ronda.
- Las operaciones de crear partida, ingresar jugador, iniciar, registrar la última estimación, cerrar, avanzar y finalizar deben completarse totalmente o no dejar cambios parciales.
- No mantengas transacciones abiertas mientras se realizan llamadas HTTP u operaciones externas.
- Las solicitudes repetidas o simultáneas no deben crear rondas, resultados, puntos ni estimaciones duplicadas.

## 10. Persistencia con MariaDB

- Configura entidades y relaciones mediante Fluent API en `Infrastructure`; mantén el dominio libre de atributos de persistencia cuando sea razonable.
- Conserva nombres de tablas y columnas en español y `snake_case`, alineados con el SQL de referencia, salvo que una migración aprobada documente el cambio.
- Verifica en MariaDB cualquier uso de `CHECK`, columnas generadas, `ENUM`, precisión temporal, vistas o expresiones provenientes del SQL para MySQL 8.
- Usa `decimal` o enteros para puntuaciones y estimaciones según el contrato; no uses `float` o `double` para cálculos que deban ser deterministas.
- Evita consultas N+1 y carga solamente las columnas necesarias para estado, resultados y ranking.
- Usa `AsNoTracking` en consultas de solo lectura cuando no se vaya a modificar la entidad.
- No uses `EnsureCreated` como mecanismo de despliegue.
- No ejecutes migraciones automáticamente al iniciar la aplicación en producción.
- Genera migraciones pequeñas, revisables y reversibles cuando sea posible. Para Plesk, produce y revisa un script idempotente antes de aplicarlo a la base remota.
- Las pruebas de persistencia y concurrencia deben ejecutarse contra MariaDB; EF Core InMemory o SQLite no sustituyen esas pruebas.

## 11. Configuración, registros y operación

- Centraliza valores configurables con Options: duración de ronda, cantidad de rondas, máximo de jugadores, expiración, CORS y rate limiting.
- Valida la configuración durante el arranque y falla con un mensaje claro si falta una opción obligatoria.
- Usa `ILogger` y logging estructurado. No uses `Console.WriteLine` como mecanismo de registro de la aplicación.
- Registra identificadores técnicos y códigos de error, pero no tokens, respuestas correctas durante una ronda activa ni cadenas de conexión.
- El endpoint `/api/v1/salud` debe comprobar la disponibilidad necesaria sin revelar información interna.
- No dependas del disco local para datos persistentes. La información de juego debe permanecer en MariaDB.

## 12. Pruebas obligatorias

Prioriza pruebas automatizadas de:

- Autorización del anfitrión y separación de roles.
- Nombre duplicado ignorando mayúsculas y espacios exteriores.
- Inicio con menos de dos jugadores.
- Ocultamiento de la respuesta correcta durante la ronda.
- Una única estimación ante solicitudes duplicadas o simultáneas.
- Rechazo de estimaciones recibidas en o después de la hora límite.
- Cierre por tiempo y cierre cuando todos responden.
- Cierre calculado una sola vez.
- Avance doble sin omitir rondas.
- Finalización únicamente después de la quinta ronda.
- Acumulación de puntos y empates cuando sus reglas pendientes hayan sido aprobadas.
- Contrato de errores y respuestas definido en OpenAPI.

Usa pruebas unitarias para reglas puras y servicios de aplicación. Usa pruebas de integración con `WebApplicationFactory` y MariaDB para rutas, autenticación, EF Core, transacciones y concurrencia. No simules la base de datos en pruebas cuyo objetivo sea comprobar restricciones o carreras.

## 13. Verificación antes de finalizar una tarea

Para cambios de código, ejecuta en proporción al alcance:

```powershell
dotnet restore
dotnet format --verify-no-changes
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
```

Si la solución aún no existe, no inventes resultados de compilación. Crea solamente lo autorizado y explica qué validación queda pendiente.

Antes de entregar:

1. Revisa el diff y confirma que solo cambiaste archivos dentro del alcance.
2. Comprueba que las respuestas HTTP coincidan con OpenAPI.
3. Comprueba que no se expongan secretos ni la respuesta correcta durante una ronda activa.
4. Ejecuta las pruebas afectadas y registra el resultado real.
5. Indica archivos modificados, decisiones tomadas, comandos ejecutados y riesgos o tareas pendientes.

## 14. Despliegue en Plesk

- Mantén una sola aplicación ASP.NET Core desplegable; no uses microservicios ni contenedores salvo autorización explícita.
- Publica en modo Release con `dotnet publish` y confirma primero que el servidor Plesk admite el runtime de .NET 8. No cambies el target framework para adaptarte silenciosamente al servidor.
- Mantén la aplicación independiente del sistema operativo: usa `Path.Combine`, evita rutas absolutas y no dependas de herramientas instaladas globalmente.
- Configura la cadena MariaDB y los secretos mediante variables del entorno de Plesk.
- Considera que HTTPS puede terminar en el proxy de Plesk; configura encabezados reenviados y redirección HTTPS de acuerdo con el entorno real.
- Restringe CORS al dominio publicado del frontend y a los orígenes aprobados para el taller.
- Aplica migraciones mediante un script revisado y realiza respaldo antes de modificar la base remota.
- Verifica después del despliegue el endpoint de salud, la conexión a MariaDB y un flujo corto de partida de prueba.

## 15. Cambios que requieren aprobación

No realices sin autorización explícita:

- Cambios en `contracts/openapi.yaml`.
- Cambios de comportamiento en requisitos o casos de uso.
- Cambios destructivos o incompatibles en la base de datos.
- Nuevos endpoints, estados o códigos de error.
- Nuevas dependencias de producción.
- Cambios de versión de .NET, EF Core o MariaDB.
- Cambios en `frontend/`.
- Implementación de funcionalidades opcionales o fuera del MVP.

Cuando una tarea sí autorice uno de estos cambios, actualiza primero la especificación correspondiente y conserva la trazabilidad entre `RF`, `CU`, operación OpenAPI, código y prueba.
