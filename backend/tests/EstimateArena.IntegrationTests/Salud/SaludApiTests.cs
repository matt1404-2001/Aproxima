using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using System.Net;
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

    private sealed record ErrorRespuesta(string Codigo, string Mensaje, DateTimeOffset MarcaTiempo);
}

public sealed class SaludApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:EstimateArena"] = "Server=127.0.0.1;Port=3307;Database=estimate_arena_pruebas;User=root;Password=no-secreto;Connection Timeout=1"
        }));
    }
}
