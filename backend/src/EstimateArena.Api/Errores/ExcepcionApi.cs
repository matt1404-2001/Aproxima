namespace EstimateArena.Api.Errores;

public sealed class ExcepcionApi(
    int statusCode,
    string codigo,
    string mensaje,
    IReadOnlyCollection<DetalleError>? detalles = null)
    : Exception(mensaje)
{
    public int StatusCode { get; } = statusCode;

    public string Codigo { get; } = codigo;

    public IReadOnlyCollection<DetalleError>? Detalles { get; } = detalles;
}
