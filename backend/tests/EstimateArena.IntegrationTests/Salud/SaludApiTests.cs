using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace EstimateArena.IntegrationTests.Salud;

public sealed class SaludApiTests : IClassFixture<SaludApiFactory>
{
    private readonly HttpClient cliente;

    public SaludApiTests(SaludApiFactory factory)
    {
        cliente = factory.CreateClient();
    }

    [Fact]
    public async Task Obtener_CuandoLaBaseDeDatosNoEstaDisponible_DevuelveErrorContractual()
    {
        var respuesta = await cliente.GetAsync("/api/v1/salud");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, respuesta.StatusCode);
        var error = await respuesta.Content.ReadFromJsonAsync<ErrorRespuesta>();
        Assert.NotNull(error);
        Assert.Equal("SERVICIO_NO_DISPONIBLE", error.Codigo);
        Assert.Equal("El servicio no esta disponible en este momento.", error.Mensaje);
        Assert.NotEqual(default, error.MarcaTiempo);
    }

    [Fact]
    public async Task RecuperarSesion_ConBearerVacio_DevuelveErrorContractual()
    {
        using var solicitud = new HttpRequestMessage(HttpMethod.Get, "/api/v1/partidas/1/sesion");
        solicitud.Headers.TryAddWithoutValidation("Authorization", "Bearer ");

        var respuesta = await cliente.SendAsync(solicitud);

        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        var error = await respuesta.Content.ReadFromJsonAsync<ErrorRespuesta>();
        Assert.NotNull(error);
        Assert.Equal("CREDENCIAL_INVALIDA", error.Codigo);
    }

    [Fact]
    public async Task Control_CuandoSuperaElLimite_DevuelveErrorContractualConCors()
    {
        HttpResponseMessage? respuesta = null;
        for (var intento = 0; intento < 11; intento++)
        {
            using var solicitud = CrearSolicitudConOrigen();
            respuesta = await cliente.SendAsync(solicitud);
            if (respuesta.StatusCode == HttpStatusCode.TooManyRequests) break;
            respuesta.Dispose();
        }

        Assert.NotNull(respuesta);
        Assert.Equal(HttpStatusCode.TooManyRequests, respuesta.StatusCode);
        Assert.NotNull(respuesta.Headers.RetryAfter);
        Assert.Equal("http://localhost:5173", respuesta.Headers.GetValues("Access-Control-Allow-Origin").Single());
        var error = await respuesta.Content.ReadFromJsonAsync<ErrorRespuesta>();
        Assert.NotNull(error);
        Assert.Equal("LIMITE_SOLICITUDES", error.Codigo);
    }

    private static HttpRequestMessage CrearSolicitudConOrigen()
    {
        var solicitud = new HttpRequestMessage(HttpMethod.Post, "/api/v1/partidas/1/iniciar");
        solicitud.Headers.Add("Origin", "http://localhost:5173");
        solicitud.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return solicitud;
    }

    private sealed record ErrorRespuesta(string Codigo, string Mensaje, DateTimeOffset MarcaTiempo);
}

public sealed class SaludApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:EstimateArena"] = "Server=127.0.0.1;Port=3307;Database=estimate_arena_pruebas;User=root;Password=no-secreto;Connection Timeout=1",
            ["LimiteSolicitudes:SolicitudesPorVentana"] = "1",
            ["LimiteSolicitudes:SolicitudesIngresoPorVentana"] = "40",
            ["LimiteSolicitudes:VentanaSegundos"] = "60"
        }));
    }
}
