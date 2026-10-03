using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EstimateArena.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class ActivarPrimeraRonda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "fecha_inicio",
                table: "rondas",
                type: "datetime(3)",
                precision: 3,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "fecha_limite",
                table: "rondas",
                type: "datetime(3)",
                precision: 3,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fecha_inicio",
                table: "rondas");

            migrationBuilder.DropColumn(
                name: "fecha_limite",
                table: "rondas");
        }
    }
}
