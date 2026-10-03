using EstimateArena.Application.Sesiones;
using EstimateArena.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;

namespace EstimateArena.Infrastructure.Sesiones;

public sealed class ValidadorSesion(EstimateArenaDbContext dbContext, IServicioTokensSesion tokens, TimeProvider timeProvider) : IValidadorSesion
{
    public async Task<SesionValidada?> ValidarAsync(string token, CancellationToken cancellationToken)
    {
        var hash = tokens.CalcularHash(token);
        var anfitrion = await dbContext.Partidas.AsNoTracking().Where(x => x.TokenAnfitrionHash == hash).Select(x => new { x.Id, x.FechaExpiracion }).SingleOrDefaultAsync(cancellationToken);
        if (anfitrion is not null && anfitrion.FechaExpiracion > timeProvider.GetUtcNow()) return new SesionValidada(anfitrion.Id, "ANFITRION", null);
        var jugador = await dbContext.Jugadores.AsNoTracking().Include(x => x.Partida).Where(x => x.TokenJugadorHash == hash).Select(x => new { x.Id, x.PartidaId, x.Partida.FechaExpiracion }).SingleOrDefaultAsync(cancellationToken);
        return jugador is not null && jugador.FechaExpiracion > timeProvider.GetUtcNow() ? new SesionValidada(jugador.PartidaId, "JUGADOR", jugador.Id) : null;
    }
}
