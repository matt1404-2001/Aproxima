using EstimateArena.Application.Sesiones;
using EstimateArena.Api.Errores;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace EstimateArena.Api.Sesiones;

public sealed class ManejadorAutenticacionSesion(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IValidadorSesion validador,
    TimeProvider timeProvider) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var encabezado = Request.Headers.Authorization.ToString();
        if (!encabezado.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.NoResult();
        var token = encabezado[7..].Trim();
        if (string.IsNullOrWhiteSpace(token)) return AuthenticateResult.Fail("CREDENCIAL_INVALIDA");
        var sesion = await validador.ValidarAsync(token, Context.RequestAborted);
        if (sesion is null) return AuthenticateResult.Fail("CREDENCIAL_INVALIDA");
        var identidad = new ClaimsIdentity([new Claim("partidaId", sesion.PartidaId.ToString()), new Claim(ClaimTypes.Role, sesion.Rol)], Scheme.Name);
        if (sesion.JugadorId is long jugadorId) identidad.AddClaim(new Claim("jugadorId", jugadorId.ToString()));
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identidad), Scheme.Name));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        Response.Headers.WWWAuthenticate = "Bearer";
        return Response.WriteAsJsonAsync(new ErrorApi("CREDENCIAL_INVALIDA", "No fue posible validar tu sesion.", null, null, null, timeProvider.GetUtcNow()));
    }

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = StatusCodes.Status403Forbidden;
        return Response.WriteAsJsonAsync(new ErrorApi("ACCESO_DENEGADO", "No tienes autorizacion para realizar esta accion.", null, null, null, timeProvider.GetUtcNow()));
    }
}
