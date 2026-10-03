namespace EstimateArena.Application.Sesiones;

public interface IServicioTokensSesion
{
    TokenSesion Crear(string prefijo);

    string CalcularHash(string token);
}

public sealed record TokenSesion(string Valor, string Hash);

public interface IValidadorSesion
{
    Task<SesionValidada?> ValidarAsync(string token, CancellationToken cancellationToken);
}

public sealed record SesionValidada(long PartidaId, string Rol, long? JugadorId);
