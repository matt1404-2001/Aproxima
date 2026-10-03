namespace EstimateArena.Domain.Partidas;

public sealed class Jugador
{
    public long Id { get; set; }
    public long PartidaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string NombreNormalizado { get; set; } = null!;
    public string TokenJugadorHash { get; set; } = null!;
    public DateTimeOffset FechaIngreso { get; set; }
    public Partida Partida { get; set; } = null!;
}
