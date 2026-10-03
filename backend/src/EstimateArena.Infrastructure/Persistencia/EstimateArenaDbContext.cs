using EstimateArena.Domain.Partidas;
using Microsoft.EntityFrameworkCore;

namespace EstimateArena.Infrastructure.Persistencia;

public sealed class EstimateArenaDbContext(DbContextOptions<EstimateArenaDbContext> options)
    : DbContext(options)
{
    public DbSet<Partida> Partidas => Set<Partida>();
    public DbSet<Jugador> Jugadores => Set<Jugador>();
    public DbSet<Desafio> Desafios => Set<Desafio>();
    public DbSet<Ronda> Rondas => Set<Ronda>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EstimateArenaDbContext).Assembly);
    }
}
