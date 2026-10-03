using System.ComponentModel.DataAnnotations;

namespace EstimateArena.Application.Configuracion;

public sealed class OpcionesPartida
{
    public const string Seccion = "Partida";

    [Range(1, 20)]
    public int CantidadRondas { get; init; } = 5;

    [Range(10, 300)]
    public int DuracionRondaSegundos { get; init; } = 30;

    [Range(2, 40)]
    public int MaximoJugadores { get; init; } = 40;

    [Range(1, 365)]
    public int ConservacionDias { get; init; } = 7;
}
