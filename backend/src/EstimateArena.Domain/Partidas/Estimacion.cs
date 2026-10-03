namespace EstimateArena.Domain.Partidas;

public sealed class Estimacion
{
    public long Id { get; set; }
    public long RondaId { get; set; }
    public long JugadorId { get; set; }
    public long Valor { get; set; }
    public DateTimeOffset FechaRecepcion { get; set; }
    public long? DiferenciaAbsoluta { get; set; }
    public int? PuntosObtenidos { get; set; }
    public DateTimeOffset? FechaCalculo { get; set; }
}
