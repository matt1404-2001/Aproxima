namespace EstimateArena.Domain.Partidas;

public enum EstadoRonda { PENDIENTE, ACTIVA, CERRADA }

public sealed class Ronda
{
    public long Id { get; set; }
    public long PartidaId { get; set; }
    public long DesafioId { get; set; }
    public int Numero { get; set; }
    public EstadoRonda Estado { get; set; } = EstadoRonda.PENDIENTE;
    public Partida Partida { get; set; } = null!;
    public Desafio Desafio { get; set; } = null!;
}
