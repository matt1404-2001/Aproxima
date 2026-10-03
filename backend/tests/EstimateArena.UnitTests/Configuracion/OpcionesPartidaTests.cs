using EstimateArena.Application.Configuracion;

namespace EstimateArena.UnitTests.Configuracion;

public sealed class OpcionesPartidaTests
{
    [Fact]
    public void ValoresPredeterminados_CoincidenConElMvp()
    {
        var opciones = new OpcionesPartida();

        Assert.Equal(5, opciones.CantidadRondas);
        Assert.Equal(30, opciones.DuracionRondaSegundos);
        Assert.Equal(40, opciones.MaximoJugadores);
        Assert.Equal(7, opciones.ConservacionDias);
    }
}
