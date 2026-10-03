using EstimateArena.Domain.Partidas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EstimateArena.Infrastructure.Persistencia;

internal sealed class PartidaConfiguracion : IEntityTypeConfiguration<Partida>
{
    public void Configure(EntityTypeBuilder<Partida> builder)
    {
        builder.ToTable("partidas");
        builder.HasKey(x => x.Id).HasName("pk_partidas");
        builder.Property(x => x.Id).HasColumnName("id_partida");
        builder.Property(x => x.Codigo).HasColumnName("codigo").HasMaxLength(5).IsUnicode(false).IsRequired();
        builder.HasIndex(x => x.Codigo).IsUnique().HasDatabaseName("uq_partidas_codigo");
        builder.Property(x => x.TokenAnfitrionHash).HasColumnName("token_anfitrion_hash").HasMaxLength(64).IsUnicode(false).IsRequired();
        builder.HasIndex(x => x.TokenAnfitrionHash).IsUnique().HasDatabaseName("uq_partidas_token_anfitrion");
        builder.Property(x => x.Estado).HasColumnName("estado").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.CantidadRondas).HasColumnName("cantidad_rondas");
        builder.Property(x => x.DuracionRondaSegundos).HasColumnName("duracion_ronda_segundos");
        builder.Property(x => x.MaximoJugadores).HasColumnName("maximo_jugadores");
        builder.Property(x => x.VersionEstado).HasColumnName("version_estado");
        builder.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion").HasPrecision(3);
        builder.Property(x => x.FechaExpiracion).HasColumnName("fecha_expiracion").HasPrecision(3);
    }
}

internal sealed class JugadorConfiguracion : IEntityTypeConfiguration<Jugador>
{
    public void Configure(EntityTypeBuilder<Jugador> builder)
    {
        builder.ToTable("jugadores");
        builder.HasKey(x => x.Id).HasName("pk_jugadores");
        builder.Property(x => x.Id).HasColumnName("id_jugador");
        builder.Property(x => x.PartidaId).HasColumnName("id_partida");
        builder.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(20).IsRequired();
        builder.Property(x => x.NombreNormalizado).HasColumnName("nombre_normalizado").HasMaxLength(20).IsRequired();
        builder.HasIndex(x => new { x.PartidaId, x.NombreNormalizado }).IsUnique().HasDatabaseName("uq_jugadores_nombre_partida");
        builder.Property(x => x.TokenJugadorHash).HasColumnName("token_jugador_hash").HasMaxLength(64).IsUnicode(false).IsRequired();
        builder.HasIndex(x => x.TokenJugadorHash).IsUnique().HasDatabaseName("uq_jugadores_token");
        builder.Property(x => x.FechaIngreso).HasColumnName("fecha_ingreso").HasPrecision(3);
        builder.HasOne(x => x.Partida).WithMany(x => x.Jugadores).HasForeignKey(x => x.PartidaId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class DesafioConfiguracion : IEntityTypeConfiguration<Desafio>
{
    public void Configure(EntityTypeBuilder<Desafio> builder)
    {
        builder.ToTable("desafios");
        builder.HasKey(x => x.Id).HasName("pk_desafios");
        builder.Property(x => x.Id).HasColumnName("id_desafio");
        builder.Property(x => x.Pregunta).HasColumnName("pregunta").HasMaxLength(500).IsRequired();
        builder.HasIndex(x => x.Pregunta).IsUnique().HasDatabaseName("uq_desafios_pregunta");
        builder.Property(x => x.RespuestaCorrecta).HasColumnName("respuesta_correcta");
        builder.Property(x => x.MargenPuntuacion).HasColumnName("margen_puntuacion");
        builder.Property(x => x.Unidad).HasColumnName("unidad").HasMaxLength(60).IsRequired();
        builder.Property(x => x.Explicacion).HasColumnName("explicacion").HasMaxLength(1000);
        builder.Property(x => x.FuenteUrl).HasColumnName("fuente_url").HasMaxLength(500);
        builder.Property(x => x.Activo).HasColumnName("activo");
    }
}

internal sealed class RondaConfiguracion : IEntityTypeConfiguration<Ronda>
{
    public void Configure(EntityTypeBuilder<Ronda> builder)
    {
        builder.ToTable("rondas");
        builder.HasKey(x => x.Id).HasName("pk_rondas");
        builder.Property(x => x.Id).HasColumnName("id_ronda");
        builder.Property(x => x.PartidaId).HasColumnName("id_partida");
        builder.Property(x => x.DesafioId).HasColumnName("id_desafio");
        builder.Property(x => x.Numero).HasColumnName("numero_ronda");
        builder.Property(x => x.Estado).HasColumnName("estado").HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.FechaInicio).HasColumnName("fecha_inicio").HasPrecision(3);
        builder.Property(x => x.FechaLimite).HasColumnName("fecha_limite").HasPrecision(3);
        builder.Property(x => x.FechaCierre).HasColumnName("fecha_cierre").HasPrecision(3);
        builder.Property(x => x.MotivoCierre).HasColumnName("motivo_cierre").HasMaxLength(24);
        builder.HasIndex(x => new { x.PartidaId, x.Numero }).IsUnique().HasDatabaseName("uq_rondas_numero_partida");
        builder.HasIndex(x => new { x.PartidaId, x.DesafioId }).IsUnique().HasDatabaseName("uq_rondas_desafio_partida");
        builder.HasOne(x => x.Partida).WithMany(x => x.Rondas).HasForeignKey(x => x.PartidaId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Desafio).WithMany().HasForeignKey(x => x.DesafioId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class EstimacionConfiguracion : IEntityTypeConfiguration<Estimacion>
{
    public void Configure(EntityTypeBuilder<Estimacion> builder)
    {
        builder.ToTable("estimaciones");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id_estimacion");
        builder.Property(x => x.RondaId).HasColumnName("id_ronda");
        builder.Property(x => x.JugadorId).HasColumnName("id_jugador");
        builder.Property(x => x.Valor).HasColumnName("valor_estimado");
        builder.Property(x => x.FechaRecepcion).HasColumnName("fecha_recepcion").HasPrecision(3);
        builder.Property(x => x.DiferenciaAbsoluta).HasColumnName("diferencia_absoluta");
        builder.Property(x => x.PuntosObtenidos).HasColumnName("puntos_obtenidos");
        builder.Property(x => x.FechaCalculo).HasColumnName("fecha_calculo").HasPrecision(3);
        builder.HasIndex(x => new { x.RondaId, x.JugadorId }).IsUnique().HasDatabaseName("uq_estimaciones_jugador_ronda");
    }
}
