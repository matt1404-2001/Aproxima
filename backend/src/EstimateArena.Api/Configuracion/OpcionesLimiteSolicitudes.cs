using System.ComponentModel.DataAnnotations;

namespace EstimateArena.Api.Configuracion;

public sealed class OpcionesLimiteSolicitudes
{
    public const string Seccion = "LimiteSolicitudes";

    [Range(1, 100)]
    public int SolicitudesPorVentana { get; init; } = 10;

    [Range(40, 200)]
    public int SolicitudesIngresoPorVentana { get; init; } = 60;

    [Range(1, 3600)]
    public int VentanaSegundos { get; init; } = 60;
}
