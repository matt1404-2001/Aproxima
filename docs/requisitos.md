# Estimate Arena — Requisitos funcionales y no funcionales

**Versión:** 1.0  
**Estado:** Propuesta aprobada para continuar el análisis  
**Proyecto:** Exposición universitaria sobre Vue.js  

## 1. Propósito del documento

Este documento define los requisitos funcionales y no funcionales de **Estimate Arena**, una aplicación web multijugador de estimaciones numéricas. Su propósito es servir como base trazable para las siguientes etapas: casos de uso, reglas de negocio definitivas, modelo de dominio, base de datos, API REST y frontend en Vue.js.

La fórmula exacta de puntuación permanece pendiente de definición. No se diseñarán tablas ni endpoints hasta resolverla.

## 2. Alcance y decisiones aprobadas

- Cada partida tendrá 5 rondas.
- Cada ronda tendrá una duración máxima de 30 segundos.
- Se permitirán entre 2 y 40 jugadores.
- El anfitrión no participará automáticamente como jugador.
- No se permitirá el ingreso de nuevos jugadores después de iniciar la partida.
- Cada jugador podrá enviar una sola estimación definitiva por ronda.
- Las estimaciones del MVP serán números enteros positivos.
- Un jugador que no responda obtendrá cero puntos en esa ronda.
- Los nombres serán únicos dentro de cada partida.
- Los empates compartirán posición en el ranking.
- La comunicación se realizará mediante API REST y polling, sin WebSockets.
- Los desafíos estarán precargados y se asignarán cinco sin repetición.
- La autoridad del tiempo pertenecerá al servidor.
- Una ronda terminará cuando se agote el tiempo o cuando todos los jugadores hayan respondido.
- El cierre anticipado mostrará primero los resultados; nunca se saltará directamente a otra pregunta.
- El anfitrión avanzará manualmente desde los resultados hacia la siguiente ronda.

Los valores de rondas, duración y límites de participantes serán configuraciones internas, no opciones visibles del MVP.

## 3. Prioridades

- **MVP:** indispensable para que el sistema cumpla su propósito.
- **Entrega:** recomendable para una demostración estable y completa.
- **Opcional:** mejora que solo se implementará si el MVP está terminado y probado.

## 4. Requisitos funcionales

### 4.1. Gestión de partidas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema deberá permitir crear una partida sin iniciar sesión ni disponer de una cuenta. | MVP |
| RF-02 | Al crear una partida, el sistema deberá generar un código público único entre las partidas activas. | MVP |
| RF-03 | El sistema deberá generar una credencial privada de anfitrión diferente del código público. | MVP |
| RF-04 | El sistema deberá entregar la credencial del anfitrión únicamente al cliente que creó la partida. | MVP |
| RF-05 | El cliente deberá conservar la credencial del anfitrión para recuperar su sesión después de recargar el navegador. | MVP |
| RF-06 | Al crear la partida, el sistema deberá asignar cinco desafíos activos sin repetirlos y conservar su orden. | MVP |
| RF-07 | La partida recién creada deberá quedar en estado `LOBBY`. | MVP |
| RF-08 | El sistema deberá impedir que el número, orden o contenido de los desafíos cambie después de crear la partida. | MVP |

### 4.2. Ingreso e identificación de jugadores

| ID | Requisito | Prioridad |
|---|---|---|
| RF-09 | El sistema deberá permitir ingresar mediante un código de partida y un nombre visible. | MVP |
| RF-10 | El sistema deberá comprobar que la partida exista y se encuentre en estado `LOBBY`. | MVP |
| RF-11 | El sistema deberá rechazar el ingreso si la partida comenzó, finalizó o alcanzó el máximo de jugadores. | MVP |
| RF-12 | El nombre deberá eliminar espacios exteriores y tener entre 2 y 20 caracteres visibles. | MVP |
| RF-13 | Los nombres deberán ser únicos dentro de una partida sin distinguir mayúsculas y minúsculas. | MVP |
| RF-14 | El sistema deberá tratar los nombres como texto y no como HTML ejecutable. | MVP |
| RF-15 | Al aceptar un jugador, el sistema deberá generar una credencial privada para identificar su sesión. | MVP |
| RF-16 | El cliente deberá conservar la credencial del jugador para recuperar la misma identidad después de una recarga. | MVP |
| RF-17 | El sistema deberá permitir que un jugador desconectado regrese utilizando una credencial válida. | MVP |
| RF-18 | La pérdida de la credencial no permitirá recuperar al jugador únicamente conociendo su nombre. | MVP |
| RF-19 | El anfitrión no deberá incluirse automáticamente como jugador. | MVP |

Los nombres se compararán después de eliminar espacios exteriores y sin distinguir mayúsculas. Por ejemplo, si existe `Carlos`, deberán rechazarse `carlos`, ` CARLOS ` y `Carlos `.

### 4.3. Lobby

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | El sistema deberá permitir consultar la información pública de una partida mediante su código. | MVP |
| RF-21 | El lobby deberá mostrar el código, estado, cantidad de jugadores y nombres de participantes. | MVP |
| RF-22 | Los clientes deberán actualizar periódicamente el lobby mediante polling. | MVP |
| RF-23 | El sistema deberá informar a los jugadores que la partida está esperando al anfitrión. | MVP |
| RF-24 | El anfitrión deberá disponer de una acción para iniciar la partida. | MVP |
| RF-25 | El sistema deberá rechazar el inicio si la credencial del anfitrión no es válida. | MVP |
| RF-26 | El sistema deberá rechazar el inicio si existen menos de dos jugadores. | MVP |
| RF-27 | Una solicitud repetida para iniciar una partida ya iniciada no deberá crear otra ronda. | Entrega |

### 4.4. Inicio y control de rondas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-28 | Al iniciar la partida, el sistema deberá activar la primera ronda. | MVP |
| RF-29 | Cada ronda deberá estar asociada con exactamente uno de los desafíos asignados. | MVP |
| RF-30 | Al activar una ronda, el servidor deberá registrar una hora oficial de inicio y una hora oficial de finalización. | MVP |
| RF-31 | La hora oficial de finalización deberá corresponder inicialmente a 30 segundos después del inicio. | MVP |
| RF-32 | La información de una ronda activa deberá incluir número de ronda, total de rondas, enunciado, unidad y hora límite. | MVP |
| RF-33 | La respuesta correcta no deberá incluirse en ninguna respuesta dirigida al cliente mientras la ronda esté activa. | MVP |
| RF-34 | Los clientes deberán mostrar un contador basado en la hora límite comunicada por el servidor. | MVP |
| RF-35 | El contador del cliente será informativo y no decidirá si una respuesta es aceptada. | MVP |
| RF-36 | El sistema deberá informar la hora actual del servidor junto con el estado para ayudar a sincronizar el contador. | Entrega |

### 4.5. Registro de estimaciones

| ID | Requisito | Prioridad |
|---|---|---|
| RF-37 | El jugador deberá poder introducir y enviar una estimación durante la ronda activa. | MVP |
| RF-38 | La estimación deberá ser un número entero positivo dentro del rango admitido. | MVP |
| RF-39 | El sistema deberá rechazar valores vacíos, no numéricos, decimales, negativos, cero o no finitos. | MVP |
| RF-40 | El sistema deberá verificar que la credencial corresponda a un jugador de la partida. | MVP |
| RF-41 | El sistema deberá verificar que la estimación corresponda a la ronda vigente. | MVP |
| RF-42 | Cada jugador podrá registrar como máximo una estimación válida por ronda. | MVP |
| RF-43 | Una estimación aceptada no podrá modificarse ni reemplazarse. | MVP |
| RF-44 | El servidor deberá registrar la hora en que recibió la estimación. | MVP |
| RF-45 | El servidor deberá rechazar cualquier estimación recibida en o después de la hora oficial de finalización. | MVP |
| RF-46 | La aceptación no deberá depender de la hora local del dispositivo del jugador. | MVP |
| RF-47 | Después de aceptar una estimación, el sistema deberá enviar una confirmación al jugador. | MVP |
| RF-48 | La interfaz deberá bloquear nuevos envíos después de recibir la confirmación. | MVP |
| RF-49 | Un doble clic, reintento o envío simultáneo no deberá crear dos estimaciones válidas. | MVP |

La interfaz ayudará a evitar envíos duplicados, pero la garantía definitiva deberá implementarse en el servidor.

### 4.6. Cierre de ronda

| ID | Requisito | Prioridad |
|---|---|---|
| RF-50 | El servidor deberá cerrar la ronda cuando se alcance la hora oficial de finalización o cuando todos los jugadores registrados hayan enviado una estimación válida. | MVP |
| RF-51 | El cierre por tiempo no deberá depender de que el anfitrión o un jugador mantenga abierta su página. | MVP |
| RF-52 | Cuando todos los jugadores hayan respondido, el sistema deberá pasar anticipadamente a `RESULTADOS` sin esperar a que finalicen los 30 segundos. | MVP |
| RF-53 | El cierre anticipado no deberá iniciar automáticamente la siguiente ronda. | MVP |
| RF-54 | Cuando se consulte una ronda ya vencida o completada, el sistema deberá reflejar el estado `RESULTADOS`. | MVP |
| RF-55 | El sistema deberá dejar de aceptar estimaciones después del cierre. | MVP |
| RF-56 | Los jugadores que no respondan antes del cierre por tiempo deberán permanecer en la partida y obtener cero puntos. | MVP |
| RF-57 | El sistema deberá calcular los resultados una sola vez de forma consistente, aunque varios clientes consulten simultáneamente. | Entrega |
| RF-58 | El anfitrión podrá disponer de una acción opcional para cerrar una ronda antes de tiempo aunque falten respuestas; la acción exigirá confirmación y asignará cero puntos a quienes no respondieron. | Opcional |

El cierre puede evaluarse cada vez que el servidor recibe una estimación o una consulta de estado. No es obligatorio utilizar una tarea programada.

### 4.7. Resultados individuales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-59 | Después del cierre, el sistema deberá revelar la respuesta correcta. | MVP |
| RF-60 | El sistema deberá mostrar a cada jugador su estimación o indicar que no respondió. | MVP |
| RF-61 | El sistema deberá calcular y mostrar la diferencia absoluta entre la estimación y la respuesta correcta. | MVP |
| RF-62 | El sistema deberá calcular los puntos exclusivamente en el servidor. | MVP |
| RF-63 | Los puntos obtenidos no podrán ser negativos. | MVP |
| RF-64 | La misma estimación para el mismo desafío deberá producir siempre la misma puntuación. | MVP |
| RF-65 | El sistema deberá impedir que el cliente envíe o modifique los puntos obtenidos. | MVP |
| RF-66 | El sistema podrá mostrar una explicación breve o fuente del dato después del cierre. | Entrega |

#### Decisión pendiente de puntuación

Antes del diseño de la API se deberá definir:

- Puntaje máximo por ronda.
- Uso de diferencia absoluta, error porcentual u otra fórmula sencilla.
- Regla de redondeo.
- Tratamiento de estimaciones extremadamente alejadas.
- Puntuación de una respuesta exacta.

### 4.8. Estadísticas de ronda

| ID | Requisito | Prioridad |
|---|---|---|
| RF-67 | El sistema deberá calcular estadísticas utilizando únicamente estimaciones válidas y aceptadas. | MVP |
| RF-68 | El sistema deberá mostrar la estimación mínima. | MVP |
| RF-69 | El sistema deberá mostrar el promedio de las estimaciones. | MVP |
| RF-70 | El sistema deberá mostrar la estimación máxima. | MVP |
| RF-71 | El sistema deberá mostrar la respuesta correcta. | MVP |
| RF-72 | El sistema deberá mostrar cuántos jugadores respondieron respecto al total. | Entrega |
| RF-73 | Si nadie respondió, el sistema deberá indicar `Sin respuestas` en lugar de presentar ceros como estadísticas. | MVP |
| RF-74 | Si solo respondió un jugador, mínimo, promedio y máximo podrán tener el mismo valor. | MVP |

La mediana y la representación gráfica de las estimaciones se mantienen como mejoras opcionales.

### 4.9. Ranking

| ID | Requisito | Prioridad |
|---|---|---|
| RF-75 | El sistema deberá acumular los puntos obtenidos por cada jugador. | MVP |
| RF-76 | El ranking deberá ordenarse de mayor a menor puntuación total. | MVP |
| RF-77 | Los jugadores con la misma puntuación total deberán compartir posición. | MVP |
| RF-78 | El ranking provisional deberá estar disponible después de cada ronda. | MVP |
| RF-79 | El sistema deberá incluir en el ranking a los jugadores que no respondieron o se desconectaron. | MVP |
| RF-80 | Los datos del ranking deberán provenir del servidor y no de cálculos independientes del cliente. | MVP |

### 4.10. Avance y finalización

| ID | Requisito | Prioridad |
|---|---|---|
| RF-81 | Durante la presentación de resultados, el anfitrión deberá disponer de una acción para avanzar. | MVP |
| RF-82 | El servidor deberá exigir una credencial válida de anfitrión para avanzar. | MVP |
| RF-83 | El anfitrión no podrá iniciar la siguiente ronda mientras la partida permanezca en `RONDA_ACTIVA`. | MVP |
| RF-84 | El anfitrión no podrá saltar directamente de una ronda activa a la siguiente pregunta; primero deberá producirse el cierre y mostrarse los resultados. | MVP |
| RF-85 | Si quedan desafíos, avanzar desde `RESULTADOS` deberá iniciar la siguiente ronda. | MVP |
| RF-86 | La nueva ronda deberá tener sus propias horas oficiales de inicio y finalización. | MVP |
| RF-87 | Una acción repetida no deberá omitir una ronda ni iniciar dos rondas simultáneamente. | Entrega |
| RF-88 | Después de los resultados de la quinta ronda, avanzar deberá finalizar la partida. | MVP |
| RF-89 | Al finalizar, el sistema deberá mostrar el ranking final. | MVP |
| RF-90 | Una partida finalizada no deberá aceptar jugadores, estimaciones ni cambios de ronda. | MVP |
| RF-91 | El sistema no deberá reiniciar una partida finalizada; el anfitrión deberá crear una nueva. | MVP |

### 4.11. Consulta sincronizada del estado

| ID | Requisito | Prioridad |
|---|---|---|
| RF-92 | Los clientes deberán consultar periódicamente el estado de la partida mediante una API REST. | MVP |
| RF-93 | El estado consultado deberá indicar `LOBBY`, `RONDA_ACTIVA`, `RESULTADOS` o `FINALIZADA`. | MVP |
| RF-94 | La respuesta deberá identificar la ronda vigente para impedir que se muestre información de una ronda anterior. | MVP |
| RF-95 | El frontend deberá cambiar de vista o contenido al detectar un nuevo estado. | MVP |
| RF-96 | El sistema deberá evitar que una respuesta antigua de polling reemplace un estado más reciente. | Entrega |
| RF-97 | Una interrupción temporal de red deberá mostrar un aviso sin eliminar la identidad local del jugador. | Entrega |
| RF-98 | Al restablecerse la conexión, el cliente deberá volver a consultar el estado oficial. | Entrega |

### 4.12. Validaciones y manejo de errores

| ID | Requisito | Prioridad |
|---|---|---|
| RF-99 | El sistema deberá rechazar toda operación incompatible con el estado actual de la partida. | MVP |
| RF-100 | Los errores deberán utilizar códigos o categorías estables que el frontend pueda interpretar. | MVP |
| RF-101 | El sistema deberá diferenciar al menos: partida inexistente, partida no disponible, nombre ocupado, partida llena, credencial inválida, ronda cerrada, estimación duplicada y valor inválido. | MVP |
| RF-102 | La interfaz deberá mostrar mensajes comprensibles y no errores técnicos internos. | Entrega |
| RF-103 | Un error en una solicitud no deberá borrar la partida, el jugador ni una estimación previamente aceptada. | MVP |

## 5. Requisitos no funcionales

### 5.1. Rendimiento

| ID | Requisito |
|---|---|
| RNF-REN-01 | Las consultas normales de estado deberán responder en menos de 1 segundo en el percentil 95 bajo la carga prevista para la exposición. |
| RNF-REN-02 | El registro de una estimación deberá responder en menos de 1 segundo en condiciones normales de red. |
| RNF-REN-03 | El sistema deberá soportar al menos 40 jugadores en una partida realizando polling cada 2 segundos. |
| RNF-REN-04 | Un cambio de estado deberá ser visible para la mayoría de clientes dentro de los 4 segundos posteriores al siguiente polling disponible. |
| RNF-REN-05 | Las consultas periódicas no deberán descargar nuevamente información estática innecesaria. |

### 5.2. Seguridad

| ID | Requisito |
|---|---|
| RNF-SEG-01 | Toda comunicación publicada deberá utilizar HTTPS. |
| RNF-SEG-02 | El código de sala nunca deberá utilizarse como autorización del anfitrión. |
| RNF-SEG-03 | Las credenciales de anfitrión y jugador deberán ser impredecibles y generadas de forma segura. |
| RNF-SEG-04 | Las credenciales privadas no deberán aparecer en URLs, mensajes públicos, rankings ni registros de errores. |
| RNF-SEG-05 | El servidor deberá validar autorización, estado y datos de entrada en cada operación sensible. |
| RNF-SEG-06 | La respuesta correcta no deberá enviarse, incrustarse en el frontend ni quedar accesible mediante endpoints públicos durante una ronda activa. |
| RNF-SEG-07 | Los nombres deberán presentarse escapados para impedir inyección de HTML o scripts. |
| RNF-SEG-08 | Los errores enviados al cliente no deberán revelar consultas, rutas internas, variables de entorno ni detalles de la base de datos. |
| RNF-SEG-09 | Las credenciales almacenadas en la base de datos deberían guardarse mediante una representación segura, como un hash. |
| RNF-SEG-10 | La API deberá restringir CORS a los orígenes utilizados por el frontend y el taller. |
| RNF-SEG-11 | Los endpoints de ingreso y control deberán tener una limitación básica de intentos para reducir abuso accidental. |

### 5.3. Integridad y consistencia

| ID | Requisito |
|---|---|
| RNF-INT-01 | La hora del servidor será la fuente oficial de todas las validaciones temporales. |
| RNF-INT-02 | Las fechas y horas deberán almacenarse y transmitirse en UTC. |
| RNF-INT-03 | El sistema deberá garantizar como máximo una estimación válida por jugador y ronda, incluso ante solicitudes simultáneas. |
| RNF-INT-04 | Una transición de estado deberá completarse totalmente o no realizarse. |
| RNF-INT-05 | El cálculo del ranking deberá utilizar resultados persistidos por el servidor. |
| RNF-INT-06 | Repetir una solicitud de control no deberá provocar dos transiciones. |
| RNF-INT-07 | Una estimación confirmada no deberá perderse por recargar la página. |
| RNF-INT-08 | El cierre anticipado por participación completa deberá ejecutarse una sola vez aunque las últimas respuestas lleguen casi simultáneamente. |

### 5.4. Disponibilidad y recuperación

| ID | Requisito |
|---|---|
| RNF-DISP-01 | El frontend, la API y la base de datos deberán estar publicados y accesibles por Internet durante la exposición. |
| RNF-DISP-02 | La aplicación deberá recuperar el estado oficial después de una interrupción temporal de conexión. |
| RNF-DISP-03 | Una falla del frontend no deberá alterar datos ya confirmados por la API. |
| RNF-DISP-04 | El sistema deberá ofrecer una forma sencilla de comprobar antes de la exposición que la API y la base de datos están disponibles. |
| RNF-DISP-05 | Deberá existir una partida de prueba o un procedimiento corto para verificar el despliegue. |

No se requiere alta disponibilidad, replicación ni recuperación automática entre servidores.

### 5.5. Usabilidad

| ID | Requisito |
|---|---|
| RNF-USA-01 | Un jugador deberá poder entrar utilizando solamente código y nombre. |
| RNF-USA-02 | Las acciones principales deberán identificarse claramente: crear, entrar, iniciar, enviar y siguiente. |
| RNF-USA-03 | La interfaz deberá mostrar siempre el estado relevante: esperando, ronda activa, respuesta enviada, resultados o finalizada. |
| RNF-USA-04 | La unidad esperada deberá mostrarse junto al campo de estimación. |
| RNF-USA-05 | El jugador deberá recibir una confirmación visual inequívoca cuando su estimación sea aceptada. |
| RNF-USA-06 | Los mensajes deberán explicar cómo corregir los errores recuperables. |
| RNF-USA-07 | El anfitrión deberá poder copiar el código de la partida mediante una acción visible. |
| RNF-USA-08 | La interfaz no deberá depender únicamente del color para comunicar estados. |
| RNF-USA-09 | Las acciones del anfitrión deberán distinguirse visualmente de la información pública. |
| RNF-USA-10 | Cuando todos hayan respondido, la interfaz deberá indicar que la ronda terminó anticipadamente y mostrar los resultados sin confundirlo con un salto de pregunta. |

### 5.6. Accesibilidad

| ID | Requisito |
|---|---|
| RNF-ACC-01 | Los formularios deberán poder utilizarse mediante teclado. |
| RNF-ACC-02 | Los campos deberán tener etiquetas visibles o accesibles. |
| RNF-ACC-03 | El texto deberá mantener un contraste legible respecto al fondo. |
| RNF-ACC-04 | El foco del teclado deberá ser visible. |
| RNF-ACC-05 | Los mensajes importantes deberán ser comprensibles por lectores de pantalla cuando sea razonable. |
| RNF-ACC-06 | Las animaciones opcionales no deberán impedir leer resultados ni utilizar controles. |

No se requiere una certificación formal de accesibilidad, pero se seguirán sus principios básicos.

### 5.7. Compatibilidad y diseño adaptable

| ID | Requisito |
|---|---|
| RNF-COMP-01 | La aplicación deberá funcionar en versiones recientes de Chrome, Edge y Firefox. |
| RNF-COMP-02 | La interfaz del jugador deberá funcionar desde 360 píxeles de ancho. |
| RNF-COMP-03 | La interfaz del anfitrión deberá ser utilizable tanto en computadora como en una pantalla proyectada. |
| RNF-COMP-04 | Las funciones esenciales no deberán depender de extensiones del navegador. |
| RNF-COMP-05 | El frontend del taller deberá funcionar en StackBlitz sin instalaciones locales. |

### 5.8. Restricciones tecnológicas y académicas

| ID | Requisito |
|---|---|
| RNF-TEC-01 | El frontend principal deberá desarrollarse con Vue 3. |
| RNF-TEC-02 | Se deberá utilizar la Composition API para demostrar `ref`, `computed` y funciones del ciclo de vida. |
| RNF-TEC-03 | La navegación entre pantallas principales deberá utilizar Vue Router. |
| RNF-TEC-04 | La interfaz deberá utilizar naturalmente `v-if`, `v-for`, `v-model` y eventos de Vue. |
| RNF-TEC-05 | El frontend deberá consumir una API REST mediante HTTP y JSON. |
| RNF-TEC-06 | La aplicación deberá utilizar una base de datos remota persistente. |
| RNF-TEC-07 | No se utilizarán WebSockets en el alcance inicial. |
| RNF-TEC-08 | No se requerirán cuentas, OAuth ni autenticación tradicional. |
| RNF-TEC-09 | No se requerirá un panel CRUD de desafíos. |
| RNF-TEC-10 | Los desafíos deberán cargarse previamente mediante datos iniciales o un procedimiento técnico controlado. |

### 5.9. Mantenibilidad y calidad

| ID | Requisito |
|---|---|
| RNF-MAN-01 | La lógica de negocio crítica deberá permanecer en el servidor y no duplicarse como autoridad en Vue. |
| RNF-MAN-02 | La generación de códigos, validación temporal, puntuación y transiciones deberán separarse conceptualmente de la presentación. |
| RNF-MAN-03 | Los nombres de estados y errores deberán ser consistentes entre requisitos, API y frontend. |
| RNF-MAN-04 | La duración, número de rondas y límite de jugadores deberán centralizarse como configuración. |
| RNF-MAN-05 | Las reglas críticas deberán contar con pruebas automatizadas o reproducibles. |
| RNF-MAN-06 | El proyecto deberá incluir instrucciones para configurar, ejecutar y desplegar sus componentes. |
| RNF-MAN-07 | La implementación deberá favorecer una arquitectura sencilla, sin microservicios ni dependencias innecesarias. |

Las pruebas prioritarias cubrirán:

- Autorización del anfitrión.
- Nombre duplicado.
- Inicio con pocos jugadores.
- Respuesta duplicada.
- Respuesta tardía.
- Cierre temprano cuando todos responden.
- Ocultamiento de la respuesta correcta.
- Cierre por tiempo.
- Avance doble.
- Acumulación de puntos.
- Ranking con empate.

### 5.10. Privacidad y conservación de datos

| ID | Requisito |
|---|---|
| RNF-PRI-01 | El sistema no deberá solicitar correos, contraseñas ni información personal adicional. |
| RNF-PRI-02 | Los nombres se considerarán alias temporales dentro de una partida. |
| RNF-PRI-03 | Las partidas y participaciones deberán poder eliminarse automáticamente después de un periodo configurable. |
| RNF-PRI-04 | Para la entrega se recomienda una conservación predeterminada de siete días. |
| RNF-PRI-05 | Los desafíos precargados no deberán eliminarse al expirar una partida. |

## 6. Trazabilidad inicial

| Área del negocio | Requisitos relacionados |
|---|---|
| Creación y autorización | RF-01 a RF-08; RNF-SEG-01 a RNF-SEG-05 |
| Ingreso y nombres | RF-09 a RF-19 |
| Lobby | RF-20 a RF-27 |
| Tiempo y rondas | RF-28 a RF-36; RF-50 a RF-58; RNF-INT-01, RNF-INT-02 y RNF-INT-08 |
| Estimaciones | RF-37 a RF-49; RNF-INT-03 |
| Resultados y puntuación | RF-59 a RF-66 |
| Estadísticas | RF-67 a RF-74 |
| Ranking | RF-75 a RF-80 |
| Avance y finalización | RF-81 a RF-91; RNF-INT-04 y RNF-INT-06 |
| Polling y recuperación | RF-92 a RF-98 |
| Validaciones y errores | RF-99 a RF-103 |
| Demostración de Vue | RNF-TEC-01 a RNF-TEC-05 |
| Base de datos y publicación | RNF-TEC-06; RNF-DISP-01 a RNF-DISP-05 |

## 7. Flujo de estados aprobado

```text
LOBBY
  └── anfitrión inicia
        ↓
RONDA_ACTIVA
  ├── termina el tiempo
  └── todos los jugadores responden
        ↓
RESULTADOS
  ├── anfitrión pulsa "Siguiente" y quedan rondas
  │     ↓
  │   RONDA_ACTIVA
  └── anfitrión pulsa "Finalizar" después de la quinta ronda
        ↓
FINALIZADA
```

El anfitrión no puede omitir el estado `RESULTADOS`. Esto conserva la oportunidad de explicar las estadísticas durante la exposición y evita cambios inesperados para los participantes.

## 8. Funcionalidades fuera del alcance inicial

- WebSockets.
- Cuentas de usuario y OAuth.
- Recuperación de credenciales perdidas.
- Chat, equipos, torneos o perfiles.
- Ingreso tardío a una partida iniciada.
- Edición de estimaciones.
- Panel administrativo completo.
- CRUD público de desafíos.
- Ranking global entre partidas.
- Modos múltiples de puntuación.
- Transferencia del papel de anfitrión.
- Sincronización al milisegundo.
- Protección contra trampas propia de un producto comercial.

