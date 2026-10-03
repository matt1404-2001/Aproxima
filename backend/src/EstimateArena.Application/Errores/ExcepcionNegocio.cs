namespace EstimateArena.Application.Errores;

public sealed class ExcepcionNegocio(int statusCode, string codigo, string mensaje, string? campo = null) : Exception(mensaje)
{
    public int StatusCode { get; } = statusCode;
    public string Codigo { get; } = codigo;
    public string? Campo { get; } = campo;
}
