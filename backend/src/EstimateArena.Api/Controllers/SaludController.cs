using EstimateArena.Api.Errores;
using EstimateArena.Api.Salud;
using EstimateArena.Infrastructure.Persistencia;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EstimateArena.Api.Controllers;

[ApiController]
[Route("api/v1/salud")]
public sealed class SaludController(EstimateArenaDbContext dbContext, TimeProvider timeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<EstadoSaludRespuesta>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorApi>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<EstadoSaludRespuesta>> Obtener(CancellationToken cancellationToken)
    {
        if (!await dbContext.Database.CanConnectAsync(cancellationToken))
        {
            throw new ExcepcionApi(
                StatusCodes.Status503ServiceUnavailable,
                "SERVICIO_NO_DISPONIBLE",
                "El servicio no esta disponible en este momento.");
        }

        return Ok(new EstadoSaludRespuesta("DISPONIBLE", "DISPONIBLE", timeProvider.GetUtcNow()));
    }
}
