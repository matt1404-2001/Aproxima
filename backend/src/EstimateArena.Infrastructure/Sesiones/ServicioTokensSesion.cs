using EstimateArena.Application.Sesiones;
using System.Security.Cryptography;
using System.Text;

namespace EstimateArena.Infrastructure.Sesiones;

public sealed class ServicioTokensSesion : IServicioTokensSesion
{
    public TokenSesion Crear(string prefijo)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(prefijo);

        var bytes = RandomNumberGenerator.GetBytes(32);
        var valor = $"{prefijo}_{Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')}";
        return new TokenSesion(valor, CalcularHash(valor));
    }

    public string CalcularHash(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }
}
