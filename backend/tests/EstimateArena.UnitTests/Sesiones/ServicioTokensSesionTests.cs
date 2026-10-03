using EstimateArena.Infrastructure.Sesiones;

namespace EstimateArena.UnitTests.Sesiones;

public sealed class ServicioTokensSesionTests
{
    private readonly ServicioTokensSesion servicio = new();

    [Fact]
    public void Crear_GeneraUnTokenAleatorioYUnHashSha256()
    {
        var primerToken = servicio.Crear("hst");
        var segundoToken = servicio.Crear("hst");

        Assert.StartsWith("hst_", primerToken.Valor, StringComparison.Ordinal);
        Assert.True(primerToken.Valor.Length >= 32);
        Assert.NotEqual(primerToken.Valor, segundoToken.Valor);
        Assert.Equal(64, primerToken.Hash.Length);
        Assert.Equal(primerToken.Hash, servicio.CalcularHash(primerToken.Valor));
    }
}
