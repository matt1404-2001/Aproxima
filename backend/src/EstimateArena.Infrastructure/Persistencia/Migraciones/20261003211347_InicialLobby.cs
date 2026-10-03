using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EstimateArena.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class InicialLobby : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "desafios",
                columns: table => new
                {
                    id_desafio = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    pregunta = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    respuesta_correcta = table.Column<long>(type: "bigint", nullable: false),
                    unidad = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    explicacion = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fuente_url = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    activo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_desafios", x => x.id_desafio);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "partidas",
                columns: table => new
                {
                    id_partida = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    codigo = table.Column<string>(type: "varchar(5)", unicode: false, maxLength: 5, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    token_anfitrion_hash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    cantidad_rondas = table.Column<int>(type: "int", nullable: false),
                    duracion_ronda_segundos = table.Column<int>(type: "int", nullable: false),
                    maximo_jugadores = table.Column<int>(type: "int", nullable: false),
                    version_estado = table.Column<long>(type: "bigint", nullable: false),
                    fecha_creacion = table.Column<DateTimeOffset>(type: "datetime(3)", precision: 3, nullable: false),
                    fecha_expiracion = table.Column<DateTimeOffset>(type: "datetime(3)", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_partidas", x => x.id_partida);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "jugadores",
                columns: table => new
                {
                    id_jugador = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    id_partida = table.Column<long>(type: "bigint", nullable: false),
                    nombre = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    nombre_normalizado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    token_jugador_hash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    fecha_ingreso = table.Column<DateTimeOffset>(type: "datetime(3)", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jugadores", x => x.id_jugador);
                    table.ForeignKey(
                        name: "FK_jugadores_partidas_id_partida",
                        column: x => x.id_partida,
                        principalTable: "partidas",
                        principalColumn: "id_partida",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rondas",
                columns: table => new
                {
                    id_ronda = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    id_partida = table.Column<long>(type: "bigint", nullable: false),
                    id_desafio = table.Column<long>(type: "bigint", nullable: false),
                    numero_ronda = table.Column<int>(type: "int", nullable: false),
                    estado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_rondas", x => x.id_ronda);
                    table.ForeignKey(
                        name: "FK_rondas_desafios_id_desafio",
                        column: x => x.id_desafio,
                        principalTable: "desafios",
                        principalColumn: "id_desafio",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_rondas_partidas_id_partida",
                        column: x => x.id_partida,
                        principalTable: "partidas",
                        principalColumn: "id_partida",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "uq_desafios_pregunta",
                table: "desafios",
                column: "pregunta",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_jugadores_nombre_partida",
                table: "jugadores",
                columns: new[] { "id_partida", "nombre_normalizado" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_jugadores_token",
                table: "jugadores",
                column: "token_jugador_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_partidas_codigo",
                table: "partidas",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_partidas_token_anfitrion",
                table: "partidas",
                column: "token_anfitrion_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rondas_id_desafio",
                table: "rondas",
                column: "id_desafio");

            migrationBuilder.CreateIndex(
                name: "uq_rondas_desafio_partida",
                table: "rondas",
                columns: new[] { "id_partida", "id_desafio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_rondas_numero_partida",
                table: "rondas",
                columns: new[] { "id_partida", "numero_ronda" },
                unique: true);

            migrationBuilder.InsertData(
                table: "desafios",
                columns: new[] { "id_desafio", "pregunta", "respuesta_correcta", "unidad", "activo" },
                values: new object[,]
                {
                    { 1L, "Cuantos kilometros mide aproximadamente la circunferencia de la Tierra alrededor del ecuador?", 40075L, "kilometros", true },
                    { 2L, "A cuantos metros sobre el nivel del mar se encuentra aproximadamente la cima del monte Everest?", 8849L, "metros", true },
                    { 3L, "Cual es la distancia promedio aproximada entre la Tierra y la Luna?", 384400L, "kilometros", true },
                    { 4L, "Cuantos litros de agua contiene aproximadamente una piscina olimpica?", 2500000L, "litros", true },
                    { 5L, "Cuantos segundos tiene un dia completo?", 86400L, "segundos", true },
                    { 6L, "Cuantas teclas tiene un piano estandar?", 88L, "teclas", true }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "jugadores");

            migrationBuilder.DropTable(
                name: "rondas");

            migrationBuilder.DropTable(
                name: "desafios");

            migrationBuilder.DropTable(
                name: "partidas");
        }
    }
}
