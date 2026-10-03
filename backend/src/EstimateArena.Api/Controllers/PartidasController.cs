using EstimateArena.Application.Partidas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace EstimateArena.Api.Controllers;

[ApiController]
[Route("api/v1/partidas")]
public sealed class PartidasController(IPartidasServicio partidas) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("crear")]
    public async Task<ActionResult<PartidaCreada>> Crear(CancellationToken cancellationToken)
    {
        var creada = await partidas.CrearAsync(cancellationToken);
        return Created($"/api/v1/partidas/{creada.PartidaId}", creada);
    }

    [HttpPost("codigo/{codigo}/jugadores")]
    [EnableRateLimiting("ingresar")]
    public async Task<ActionResult<JugadorIngresado>> Ingresar(string codigo, [FromBody] IngresarJugadorSolicitud solicitud, CancellationToken cancellationToken)
    {
        return Created(string.Empty, await partidas.IngresarAsync(codigo, solicitud.Nombre, cancellationToken));
    }

    [HttpGet("{partidaId:long}/sesion")]
    [Authorize]
    public Task<SesionRecuperada> RecuperarSesion(long partidaId, CancellationToken cancellationToken) =>
        partidas.RecuperarSesionAsync(partidaId, ObtenerSesion(), cancellationToken);

    [HttpGet("{partidaId:long}/estado")]
    [Authorize]
    public Task<object> ConsultarEstado(long partidaId, CancellationToken cancellationToken) =>
        partidas.ConsultarEstadoAsync(partidaId, ObtenerSesion(), cancellationToken);

    [HttpPost("{partidaId:long}/iniciar")]
    [Authorize(Roles = "ANFITRION")]
    [EnableRateLimiting("control")]
    public Task<TransicionPartida> Iniciar(long partidaId, CancellationToken cancellationToken) =>
        partidas.IniciarAsync(partidaId, ObtenerSesion(), cancellationToken);

    [HttpPost("{partidaId:long}/rondas/{rondaId:long}/estimaciones")]
    [Authorize(Roles = "JUGADOR")]
    public Task<EstimacionAceptada> EnviarEstimacion(long partidaId, long rondaId, [FromBody] EnviarEstimacionSolicitud solicitud, CancellationToken cancellationToken) =>
        partidas.EnviarEstimacionAsync(partidaId, rondaId, solicitud.Valor, ObtenerSesion(), cancellationToken);

    [HttpGet("{partidaId:long}/rondas/{rondaId:long}/resultados")]
    [Authorize]
    public Task<ResultadosRonda> ConsultarResultados(long partidaId, long rondaId, CancellationToken cancellationToken) =>
        partidas.ConsultarResultadosAsync(partidaId, rondaId, ObtenerSesion(), cancellationToken);

    private SesionActual ObtenerSesion()
    {
        var partidaId = long.Parse(User.FindFirstValue("partidaId")!);
        var jugador = User.FindFirstValue("jugadorId");
        return new SesionActual(partidaId, User.FindFirstValue(ClaimTypes.Role)!, jugador is null ? null : long.Parse(jugador));
    }
}

public sealed class EnviarEstimacionSolicitud { public long Valor { get; init; } }

public sealed class IngresarJugadorSolicitud
{
    [System.ComponentModel.DataAnnotations.Required]
    public string Nombre { get; init; } = null!;
}
