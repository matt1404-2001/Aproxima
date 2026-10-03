CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    ALTER DATABASE CHARACTER SET utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE TABLE `desafios` (
        `id_desafio` bigint NOT NULL AUTO_INCREMENT,
        `pregunta` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
        `respuesta_correcta` bigint NOT NULL,
        `unidad` varchar(60) CHARACTER SET utf8mb4 NOT NULL,
        `explicacion` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `fuente_url` varchar(500) CHARACTER SET utf8mb4 NULL,
        `activo` tinyint(1) NOT NULL,
        CONSTRAINT `pk_desafios` PRIMARY KEY (`id_desafio`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE TABLE `partidas` (
        `id_partida` bigint NOT NULL AUTO_INCREMENT,
        `codigo` varchar(5) CHARACTER SET utf8mb4 NOT NULL,
        `token_anfitrion_hash` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
        `estado` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `cantidad_rondas` int NOT NULL,
        `duracion_ronda_segundos` int NOT NULL,
        `maximo_jugadores` int NOT NULL,
        `version_estado` bigint NOT NULL,
        `fecha_creacion` datetime(3) NOT NULL,
        `fecha_expiracion` datetime(3) NULL,
        CONSTRAINT `pk_partidas` PRIMARY KEY (`id_partida`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE TABLE `jugadores` (
        `id_jugador` bigint NOT NULL AUTO_INCREMENT,
        `id_partida` bigint NOT NULL,
        `nombre` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `nombre_normalizado` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `token_jugador_hash` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
        `fecha_ingreso` datetime(3) NOT NULL,
        CONSTRAINT `pk_jugadores` PRIMARY KEY (`id_jugador`),
        CONSTRAINT `FK_jugadores_partidas_id_partida` FOREIGN KEY (`id_partida`) REFERENCES `partidas` (`id_partida`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE TABLE `rondas` (
        `id_ronda` bigint NOT NULL AUTO_INCREMENT,
        `id_partida` bigint NOT NULL,
        `id_desafio` bigint NOT NULL,
        `numero_ronda` int NOT NULL,
        `estado` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        CONSTRAINT `pk_rondas` PRIMARY KEY (`id_ronda`),
        CONSTRAINT `FK_rondas_desafios_id_desafio` FOREIGN KEY (`id_desafio`) REFERENCES `desafios` (`id_desafio`) ON DELETE RESTRICT,
        CONSTRAINT `FK_rondas_partidas_id_partida` FOREIGN KEY (`id_partida`) REFERENCES `partidas` (`id_partida`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_desafios_pregunta` ON `desafios` (`pregunta`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_jugadores_nombre_partida` ON `jugadores` (`id_partida`, `nombre_normalizado`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_jugadores_token` ON `jugadores` (`token_jugador_hash`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_partidas_codigo` ON `partidas` (`codigo`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_partidas_token_anfitrion` ON `partidas` (`token_anfitrion_hash`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE INDEX `IX_rondas_id_desafio` ON `rondas` (`id_desafio`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_rondas_desafio_partida` ON `rondas` (`id_partida`, `id_desafio`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    CREATE UNIQUE INDEX `uq_rondas_numero_partida` ON `rondas` (`id_partida`, `numero_ronda`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    INSERT INTO `desafios` (`id_desafio`, `pregunta`, `respuesta_correcta`, `unidad`, `activo`)
    VALUES (1, 'Cuantos kilometros mide aproximadamente la circunferencia de la Tierra alrededor del ecuador?', 40075, 'kilometros', TRUE),
    (2, 'A cuantos metros sobre el nivel del mar se encuentra aproximadamente la cima del monte Everest?', 8849, 'metros', TRUE),
    (3, 'Cual es la distancia promedio aproximada entre la Tierra y la Luna?', 384400, 'kilometros', TRUE),
    (4, 'Cuantos litros de agua contiene aproximadamente una piscina olimpica?', 2500000, 'litros', TRUE),
    (5, 'Cuantos segundos tiene un dia completo?', 86400, 'segundos', TRUE),
    (6, 'Cuantas teclas tiene un piano estandar?', 88, 'teclas', TRUE);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20261003211347_InicialLobby') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20261003211347_InicialLobby', '8.0.13');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

