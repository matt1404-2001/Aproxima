namespace EstimateArena.Api.Errores;

public sealed record ErrorApi(
    string Codigo,
    string Mensaje,
    IReadOnlyCollection<DetalleError>? Detalles,
    string? EstadoActual,
    long? RondaActualId,
    DateTimeOffset MarcaTiempo);

public sealed record DetalleError(string? Campo, string Codigo, string Mensaje);
