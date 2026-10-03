namespace EstimateArena.Domain.Partidas;

public sealed class Desafio
{
    public long Id { get; set; }
    public string Pregunta { get; set; } = null!;
    public long RespuestaCorrecta { get; set; }
    public string Unidad { get; set; } = null!;
    public string? Explicacion { get; set; }
    public string? FuenteUrl { get; set; }
    public bool Activo { get; set; }
}
