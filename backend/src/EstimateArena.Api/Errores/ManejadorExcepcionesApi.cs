using Microsoft.AspNetCore.Diagnostics;
using EstimateArena.Application.Errores;

namespace EstimateArena.Api.Errores;

public sealed class ManejadorExcepcionesApi(
    ILogger<ManejadorExcepcionesApi> logger,
    TimeProvider timeProvider) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, codigo, mensaje, detalles) = exception switch
        {
            ExcepcionApi error => (error.StatusCode, error.Codigo, error.Message, error.Detalles),
            ExcepcionNegocio error => (error.StatusCode, error.Codigo, error.Message, error.Campo is null ? null : new[] { new DetalleError(error.Campo, "VALOR_INVALIDO", error.Message) }),
            _ => (StatusCodes.Status500InternalServerError, "ERROR_INTERNO", "No fue posible completar la operacion.", null)
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Error no controlado al atender {Metodo} {Ruta}.", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogInformation("Solicitud rechazada con codigo {Codigo}.", codigo);
        }

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(
            new ErrorApi(codigo, mensaje, detalles, null, null, timeProvider.GetUtcNow()),
            cancellationToken);

        return true;
    }
}
