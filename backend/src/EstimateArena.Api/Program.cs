using EstimateArena.Api.Configuracion;
using EstimateArena.Api.Errores;
using EstimateArena.Application.Configuracion;
using EstimateArena.Application.Sesiones;
using EstimateArena.Application.Partidas;
using EstimateArena.Infrastructure.Persistencia;
using EstimateArena.Infrastructure.Partidas;
using EstimateArena.Infrastructure.Sesiones;
using EstimateArena.Api.Sesiones;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IServicioTokensSesion, ServicioTokensSesion>();
builder.Services.AddScoped<IValidadorSesion, ValidadorSesion>();
builder.Services.AddScoped<IPartidasServicio, ServicioPartidas>();
builder.Services.AddAuthentication("SesionBearer").AddScheme<AuthenticationSchemeOptions, ManejadorAutenticacionSesion>("SesionBearer", null);
builder.Services.AddAuthorization();
builder.Services.AddExceptionHandler<ManejadorExcepcionesApi>();
builder.Services.AddProblemDetails();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
    })
    .ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var detalles = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .SelectMany(entry => entry.Value!.Errors.Select(error => new DetalleError(
                entry.Key,
                "VALOR_INVALIDO",
                string.IsNullOrWhiteSpace(error.ErrorMessage) ? "El valor enviado no es valido." : error.ErrorMessage)))
            .ToArray();

        return new BadRequestObjectResult(new ErrorApi(
            "DATOS_INVALIDOS",
            "Revisa los datos enviados.",
            detalles,
            null,
            null,
            TimeProvider.System.GetUtcNow()));
    };
});
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

builder.Services.AddOptions<OpcionesPartida>()
    .BindConfiguration(OpcionesPartida.Seccion)
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddOptions<OpcionesCors>()
    .BindConfiguration(OpcionesCors.Seccion)
    .ValidateDataAnnotations()
    .ValidateOnStart();
builder.Services.AddOptions<OpcionesLimiteSolicitudes>()
    .BindConfiguration(OpcionesLimiteSolicitudes.Seccion)
    .ValidateDataAnnotations()
    .ValidateOnStart();

var cadenaConexion = builder.Configuration.GetConnectionString("EstimateArena");
if (string.IsNullOrWhiteSpace(cadenaConexion))
{
    throw new InvalidOperationException("Falta la cadena de conexion ConnectionStrings:EstimateArena.");
}

builder.Services.AddDbContext<EstimateArenaDbContext>(options =>
    options.UseMySql(cadenaConexion, new MariaDbServerVersion(new Version(10, 6, 0))));

var cors = builder.Configuration.GetSection(OpcionesCors.Seccion).Get<OpcionesCors>() ?? new OpcionesCors();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins(cors.OrigenesPermitidos).AllowAnyHeader().AllowAnyMethod()));

var limites = builder.Configuration.GetSection(OpcionesLimiteSolicitudes.Seccion).Get<OpcionesLimiteSolicitudes>()
    ?? new OpcionesLimiteSolicitudes();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var respuesta = context.HttpContext.Response;
        respuesta.StatusCode = StatusCodes.Status429TooManyRequests;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var espera))
        {
            respuesta.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(espera.TotalSeconds)).ToString();
        }

        var reloj = context.HttpContext.RequestServices.GetRequiredService<TimeProvider>();
        await respuesta.WriteAsJsonAsync(
            new ErrorApi("LIMITE_SOLICITUDES", "Espera unos segundos antes de intentarlo nuevamente.", null, null, null, reloj.GetUtcNow()),
            cancellationToken);
    };
    AgregarLimite(options, "crear", limites.SolicitudesPorVentana, limites.VentanaSegundos);
    AgregarLimite(options, "ingresar", limites.SolicitudesIngresoPorVentana, limites.VentanaSegundos);
    AgregarLimite(options, "control", limites.SolicitudesPorVentana, limites.VentanaSegundos);
    AgregarLimite(options, "estimacion", limites.SolicitudesPorVentana, limites.VentanaSegundos);
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});
app.UseExceptionHandler();
app.UseRouting();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();

app.Run();

static void AgregarLimite(RateLimiterOptions options, string nombre, int solicitudesPorVentana, int ventanaSegundos)
{
    options.AddPolicy(nombre, contexto => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: ObtenerClaveParticion(contexto),
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = solicitudesPorVentana,
            Window = TimeSpan.FromSeconds(ventanaSegundos),
            QueueLimit = 0
        }));
}

static string ObtenerClaveParticion(HttpContext contexto)
{
    var partidaId = contexto.User.FindFirst("partidaId")?.Value;
    if (partidaId is not null)
    {
        var jugadorId = contexto.User.FindFirst("jugadorId")?.Value;
        return jugadorId is null ? $"anfitrion:{partidaId}" : $"jugador:{partidaId}:{jugadorId}";
    }

    return contexto.Connection.RemoteIpAddress?.ToString() ?? "sin-ip";
}

public partial class Program;
