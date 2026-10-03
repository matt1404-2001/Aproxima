-- ============================================================
-- Estimate Arena
-- Esquema de base de datos para MySQL 8.0.16 o superior
-- Las fechas y horas deben manejarse en UTC.
-- ============================================================

CREATE DATABASE IF NOT EXISTS estimate_arena
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE estimate_arena;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ------------------------------------------------------------
-- 1. Desafíos precargados
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS desafios (
    id_desafio BIGINT UNSIGNED AUTO_INCREMENT,
    pregunta VARCHAR(500) NOT NULL,
    respuesta_correcta BIGINT UNSIGNED NOT NULL,
    unidad VARCHAR(60) NOT NULL,
    explicacion VARCHAR(1000) NULL,
    fuente_url VARCHAR(500) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    fecha_actualizacion DATETIME(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    CONSTRAINT pk_desafios PRIMARY KEY (id_desafio),
    CONSTRAINT uq_desafios_pregunta UNIQUE (pregunta),
    CONSTRAINT chk_desafios_respuesta_positiva
        CHECK (respuesta_correcta > 0),
    CONSTRAINT chk_desafios_pregunta_no_vacia
        CHECK (CHAR_LENGTH(TRIM(pregunta)) > 0),
    CONSTRAINT chk_desafios_unidad_no_vacia
        CHECK (CHAR_LENGTH(TRIM(unidad)) > 0)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 2. Partidas
-- El código es público. El token del anfitrión es privado y se
-- almacena únicamente como hash SHA-256 representado en hexadecimal.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partidas (
    id_partida BIGINT UNSIGNED AUTO_INCREMENT,
    codigo CHAR(5) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    token_anfitrion_hash CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    estado ENUM(
        'LOBBY',
        'RONDA_ACTIVA',
        'RESULTADOS',
        'FINALIZADA'
    ) NOT NULL DEFAULT 'LOBBY',
    cantidad_rondas TINYINT UNSIGNED NOT NULL DEFAULT 5,
    duracion_ronda_segundos SMALLINT UNSIGNED NOT NULL DEFAULT 30,
    maximo_jugadores SMALLINT UNSIGNED NOT NULL DEFAULT 40,
    fecha_creacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    fecha_inicio DATETIME(3) NULL,
    fecha_finalizacion DATETIME(3) NULL,
    fecha_expiracion DATETIME(3) NULL,
    fecha_actualizacion DATETIME(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),

    CONSTRAINT pk_partidas PRIMARY KEY (id_partida),
    CONSTRAINT uq_partidas_codigo UNIQUE (codigo),
    CONSTRAINT uq_partidas_token_anfitrion UNIQUE (token_anfitrion_hash),
    CONSTRAINT chk_partidas_codigo
        CHECK (codigo REGEXP '^[A-Z0-9]{5}$'),
    CONSTRAINT chk_partidas_cantidad_rondas
        CHECK (cantidad_rondas BETWEEN 1 AND 20),
    CONSTRAINT chk_partidas_duracion
        CHECK (duracion_ronda_segundos BETWEEN 10 AND 300),
    CONSTRAINT chk_partidas_maximo_jugadores
        CHECK (maximo_jugadores BETWEEN 2 AND 40),
    CONSTRAINT chk_partidas_fechas
        CHECK (
            (fecha_inicio IS NULL OR fecha_inicio >= fecha_creacion)
            AND
            (fecha_finalizacion IS NULL OR fecha_inicio IS NOT NULL)
            AND
            (fecha_finalizacion IS NULL OR fecha_finalizacion >= fecha_inicio)
            AND
            (fecha_expiracion IS NULL OR fecha_expiracion > fecha_creacion)
        ),
    INDEX idx_partidas_estado_expiracion (estado, fecha_expiracion)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 3. Jugadores
-- nombre_normalizado se genera automáticamente para impedir nombres
-- duplicados como "Carlos", "carlos" o " Carlos ".
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS jugadores (
    id_jugador BIGINT UNSIGNED AUTO_INCREMENT,
    id_partida BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(20) NOT NULL,
    nombre_normalizado VARCHAR(20)
        GENERATED ALWAYS AS (LOWER(TRIM(nombre))) STORED,
    token_jugador_hash CHAR(64)
        CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    fecha_ingreso DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    CONSTRAINT pk_jugadores PRIMARY KEY (id_jugador),
    CONSTRAINT uq_jugadores_nombre_partida
        UNIQUE (id_partida, nombre_normalizado),
    CONSTRAINT uq_jugadores_token UNIQUE (token_jugador_hash),
    CONSTRAINT fk_jugadores_partida
        FOREIGN KEY (id_partida)
        REFERENCES partidas (id_partida)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT chk_jugadores_nombre
        CHECK (CHAR_LENGTH(TRIM(nombre)) BETWEEN 2 AND 20)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 4. Rondas
-- Las cinco rondas pueden insertarse como PENDIENTE al crear la
-- partida. Cada ronda conserva el desafío y su posición en el orden.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rondas (
    id_ronda BIGINT UNSIGNED AUTO_INCREMENT,
    id_partida BIGINT UNSIGNED NOT NULL,
    id_desafio BIGINT UNSIGNED NOT NULL,
    numero_ronda TINYINT UNSIGNED NOT NULL,
    estado ENUM('PENDIENTE', 'ACTIVA', 'CERRADA')
        NOT NULL DEFAULT 'PENDIENTE',
    fecha_inicio DATETIME(3) NULL,
    fecha_limite DATETIME(3) NULL,
    fecha_cierre DATETIME(3) NULL,
    motivo_cierre ENUM(
        'TIEMPO_AGOTADO',
        'TODOS_RESPONDIERON',
        'ANFITRION'
    ) NULL,

    CONSTRAINT pk_rondas PRIMARY KEY (id_ronda),
    CONSTRAINT uq_rondas_numero_partida
        UNIQUE (id_partida, numero_ronda),
    CONSTRAINT uq_rondas_desafio_partida
        UNIQUE (id_partida, id_desafio),
    CONSTRAINT fk_rondas_partida
        FOREIGN KEY (id_partida)
        REFERENCES partidas (id_partida)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_rondas_desafio
        FOREIGN KEY (id_desafio)
        REFERENCES desafios (id_desafio)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT chk_rondas_numero
        CHECK (numero_ronda BETWEEN 1 AND 20),
    CONSTRAINT chk_rondas_fechas
        CHECK (
            (fecha_limite IS NULL OR fecha_inicio IS NOT NULL)
            AND
            (fecha_limite IS NULL OR fecha_limite > fecha_inicio)
            AND
            (fecha_cierre IS NULL OR fecha_inicio IS NOT NULL)
            AND
            (fecha_cierre IS NULL OR fecha_cierre >= fecha_inicio)
        ),
    CONSTRAINT chk_rondas_estado
        CHECK (
            (
                estado = 'PENDIENTE'
                AND fecha_inicio IS NULL
                AND fecha_limite IS NULL
                AND fecha_cierre IS NULL
                AND motivo_cierre IS NULL
            )
            OR
            (
                estado = 'ACTIVA'
                AND fecha_inicio IS NOT NULL
                AND fecha_limite IS NOT NULL
                AND fecha_cierre IS NULL
                AND motivo_cierre IS NULL
            )
            OR
            (
                estado = 'CERRADA'
                AND fecha_inicio IS NOT NULL
                AND fecha_limite IS NOT NULL
                AND fecha_cierre IS NOT NULL
                AND motivo_cierre IS NOT NULL
            )
        ),
    INDEX idx_rondas_partida_estado
        (id_partida, estado, numero_ronda)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 5. Estimaciones y resultados individuales
-- Una estimación aceptada es definitiva. La diferencia y los puntos
-- permanecen NULL hasta que el servidor cierre y puntúe la ronda.
-- Si un jugador no responde no se crea una fila; sus puntos son cero.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS estimaciones (
    id_estimacion BIGINT UNSIGNED AUTO_INCREMENT,
    id_ronda BIGINT UNSIGNED NOT NULL,
    id_jugador BIGINT UNSIGNED NOT NULL,
    valor_estimado BIGINT UNSIGNED NOT NULL,
    fecha_recepcion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    diferencia_absoluta BIGINT UNSIGNED NULL,
    puntos_obtenidos INT UNSIGNED NULL,
    fecha_calculo DATETIME(3) NULL,

    CONSTRAINT pk_estimaciones PRIMARY KEY (id_estimacion),
    CONSTRAINT uq_estimaciones_jugador_ronda
        UNIQUE (id_ronda, id_jugador),
    CONSTRAINT fk_estimaciones_ronda
        FOREIGN KEY (id_ronda)
        REFERENCES rondas (id_ronda)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT fk_estimaciones_jugador
        FOREIGN KEY (id_jugador)
        REFERENCES jugadores (id_jugador)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT chk_estimaciones_valor_positivo
        CHECK (valor_estimado > 0),
    CONSTRAINT chk_estimaciones_resultado_completo
        CHECK (
            (
                diferencia_absoluta IS NULL
                AND puntos_obtenidos IS NULL
                AND fecha_calculo IS NULL
            )
            OR
            (
                diferencia_absoluta IS NOT NULL
                AND puntos_obtenidos IS NOT NULL
                AND fecha_calculo IS NOT NULL
            )
        ),
    INDEX idx_estimaciones_jugador (id_jugador)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- Vistas calculadas
-- No se crean tablas de estadísticas ni ranking porque serían datos
-- duplicados que pueden calcularse desde las estimaciones guardadas.
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW vista_estadisticas_ronda AS
SELECT
    r.id_ronda,
    r.id_partida,
    r.numero_ronda,
    COUNT(e.id_estimacion) AS cantidad_respuestas,
    MIN(e.valor_estimado) AS estimacion_minima,
    AVG(e.valor_estimado) AS promedio_estimaciones,
    MAX(e.valor_estimado) AS estimacion_maxima
FROM rondas AS r
LEFT JOIN estimaciones AS e
    ON e.id_ronda = r.id_ronda
GROUP BY
    r.id_ronda,
    r.id_partida,
    r.numero_ronda;

CREATE OR REPLACE VIEW vista_puntuaciones_partida AS
SELECT
    j.id_partida,
    j.id_jugador,
    j.nombre,
    COALESCE(SUM(e.puntos_obtenidos), 0) AS puntos_totales,
    COUNT(e.id_estimacion) AS respuestas_enviadas,
    COUNT(e.puntos_obtenidos) AS rondas_puntuadas
FROM jugadores AS j
LEFT JOIN estimaciones AS e
    ON e.id_jugador = j.id_jugador
GROUP BY
    j.id_partida,
    j.id_jugador,
    j.nombre;

-- ------------------------------------------------------------
-- Desafíos iniciales
-- La aplicación necesita por lo menos cinco desafíos activos.
-- Se usa INSERT IGNORE para que el bloque pueda ejecutarse nuevamente.
-- ------------------------------------------------------------

INSERT IGNORE INTO desafios
    (pregunta, respuesta_correcta, unidad, explicacion, fuente_url)
VALUES
    (
        '¿Cuántos kilómetros mide aproximadamente la circunferencia de la Tierra alrededor del ecuador?',
        40075,
        'kilómetros',
        'La circunferencia ecuatorial de la Tierra es de aproximadamente 40 075 kilómetros.',
        NULL
    ),
    (
        '¿A cuántos metros sobre el nivel del mar se encuentra aproximadamente la cima del monte Everest?',
        8849,
        'metros',
        'La altura oficial del monte Everest es de aproximadamente 8 849 metros.',
        NULL
    ),
    (
        '¿Cuál es la distancia promedio aproximada entre la Tierra y la Luna?',
        384400,
        'kilómetros',
        'La distancia promedio entre la Tierra y la Luna es de aproximadamente 384 400 kilómetros.',
        NULL
    ),
    (
        '¿Cuántos litros de agua contiene aproximadamente una piscina olímpica?',
        2500000,
        'litros',
        'Una estimación habitual para una piscina olímpica es de unos 2,5 millones de litros.',
        NULL
    ),
    (
        '¿Cuántos segundos tiene un día completo?',
        86400,
        'segundos',
        'Un día tiene 24 horas, cada hora 60 minutos y cada minuto 60 segundos.',
        NULL
    ),
    (
        '¿Cuántas teclas tiene un piano estándar?',
        88,
        'teclas',
        'Un piano estándar moderno tiene 88 teclas.',
        NULL
    ),
    (
        '¿Cuántos huesos tiene aproximadamente el cuerpo humano adulto?',
        206,
        'huesos',
        'La cifra utilizada normalmente para una persona adulta es de 206 huesos.',
        NULL
    ),
    (
        '¿Cuántos kilómetros mide aproximadamente el canal de Panamá?',
        82,
        'kilómetros',
        'El canal de Panamá tiene una longitud aproximada de 82 kilómetros.',
        NULL
    ),
    (
        '¿En qué año llegó por primera vez una persona a la Luna?',
        1969,
        'año',
        'La misión Apolo 11 llegó a la Luna en 1969.',
        NULL
    ),
    (
        '¿Cuántos metros de altura mide aproximadamente la Torre Eiffel incluyendo su antena?',
        330,
        'metros',
        'La Torre Eiffel alcanza aproximadamente 330 metros incluyendo su antena.',
        NULL
    );

-- ============================================================
-- Reglas que debe aplicar la API dentro de una transacción
-- ============================================================
-- 1. Asignar exactamente cinco rondas distintas al crear la partida.
-- 2. Comprobar que el jugador y la ronda pertenecen a la misma partida.
-- 3. Aceptar estimaciones únicamente durante una ronda ACTIVA.
-- 4. Comparar fecha_recepcion con fecha_limite usando la hora del servidor.
-- 5. Calcular diferencia y puntos al cerrar la ronda.
-- 6. Cambiar partidas.estado y rondas.estado de manera atómica.
-- 7. No enviar desafios.respuesta_correcta durante RONDA_ACTIVA.
-- 8. Guardar únicamente hashes de tokens, nunca los tokens originales.
