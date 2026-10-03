namespace EstimateArena.Domain.Partidas;

public sealed class Partida
{
    public long Id { get; set; }
    public string Codigo { get; set; } = null!;
    public string TokenAnfitrionHash { get; set; } = null!;
    public EstadoPartida Estado { get; set; } = EstadoPartida.LOBBY;
    public int CantidadRondas { get; set; }
    public int DuracionRondaSegundos { get; set; }
    public int MaximoJugadores { get; set; }
    public long VersionEstado { get; set; } = 1;
    public DateTimeOffset FechaCreacion { get; set; }
    public DateTimeOffset? FechaExpiracion { get; set; }
    public ICollection<Jugador> Jugadores { get; } = new List<Jugador>();
    public ICollection<Ronda> Rondas { get; } = new List<Ronda>();
}
