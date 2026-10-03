using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EstimateArena.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class EstimacionesYPuntuacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "fecha_cierre",
                table: "rondas",
                type: "datetime(3)",
                precision: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "motivo_cierre",
                table: "rondas",
                type: "varchar(24)",
                maxLength: 24,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "margen_puntuacion",
                table: "desafios",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.Sql("UPDATE desafios SET margen_puntuacion = respuesta_correcta WHERE margen_puntuacion = 0");

            migrationBuilder.AlterColumn<long>(
                name: "margen_puntuacion",
                table: "desafios",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldDefaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "estimaciones",
                columns: table => new
                {
                    id_estimacion = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    id_ronda = table.Column<long>(type: "bigint", nullable: false),
                    id_jugador = table.Column<long>(type: "bigint", nullable: false),
                    valor_estimado = table.Column<long>(type: "bigint", nullable: false),
                    fecha_recepcion = table.Column<DateTimeOffset>(type: "datetime(3)", precision: 3, nullable: false),
                    diferencia_absoluta = table.Column<long>(type: "bigint", nullable: true),
                    puntos_obtenidos = table.Column<int>(type: "int", nullable: true),
                    fecha_calculo = table.Column<DateTimeOffset>(type: "datetime(3)", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_estimaciones", x => x.id_estimacion);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "uq_estimaciones_jugador_ronda",
                table: "estimaciones",
                columns: new[] { "id_ronda", "id_jugador" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "estimaciones");

            migrationBuilder.DropColumn(
                name: "fecha_cierre",
                table: "rondas");

            migrationBuilder.DropColumn(
                name: "motivo_cierre",
                table: "rondas");

            migrationBuilder.DropColumn(
                name: "margen_puntuacion",
                table: "desafios");
        }
    }
}
