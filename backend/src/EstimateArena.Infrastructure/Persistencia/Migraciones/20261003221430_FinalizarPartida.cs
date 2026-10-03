using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EstimateArena.Infrastructure.Persistencia.Migraciones
{
    /// <inheritdoc />
    public partial class FinalizarPartida : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "fecha_finalizacion",
                table: "partidas",
                type: "datetime(3)",
                precision: 3,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "fecha_finalizacion",
                table: "partidas");
        }
    }
}
