using EstimateArena.Application.Partidas;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EstimateArena.UnitTests.Partidas;

public sealed class ContratoRespuestasTests
{
    private static readonly JsonSerializerOptions OpcionesJson = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    [Fact]
    public void ResultadosRonda_SinRespuestas_ConservaPropiedadesNulasRequeridas()
    {
        var respuesta = new ResultadosRonda(
            1,
            2,
            1,
            5,
            "Pregunta",
            "metros",
            100,
            "TIEMPO_AGOTADO",
            DateTimeOffset.Parse("2026-10-03T16:00:30Z"),
            new EstadisticasRonda(false, 0, 2, null, null, null),
            null,
            null,
            null,
            DateTimeOffset.Parse("2026-10-03T16:00:31Z"));

        using var documento = JsonDocument.Parse(JsonSerializer.Serialize(respuesta, OpcionesJson));
        var raiz = documento.RootElement;
        var estadisticas = raiz.GetProperty("estadisticas");

        Assert.Equal(JsonValueKind.Null, raiz.GetProperty("resultadoPersonal").ValueKind);
        Assert.Equal(JsonValueKind.Null, estadisticas.GetProperty("estimacionMinima").ValueKind);
        Assert.Equal(JsonValueKind.Null, estadisticas.GetProperty("promedio").ValueKind);
        Assert.Equal(JsonValueKind.Null, estadisticas.GetProperty("estimacionMaxima").ValueKind);
        Assert.False(raiz.TryGetProperty("explicacion", out _));
        Assert.False(raiz.TryGetProperty("fuente", out _));
    }

    [Fact]
    public void EstadoRondaActiva_JugadorQueRespondio_IncluyeSuParticipacion()
    {
        var recibidaEn = DateTimeOffset.Parse("2026-10-03T16:00:15Z");
        var estado = new EstadoRondaActiva(
            1,
            "ABCDE",
            "RONDA_ACTIVA",
            4,
            recibidaEn,
            "JUGADOR",
            2000,
            new RondaActiva(2, 1, 5, "Pregunta", "metros", recibidaEn.AddSeconds(-15), recibidaEn.AddSeconds(15), new ParticipacionRonda(true, 75, recibidaEn)));

        using var documento = JsonDocument.Parse(JsonSerializer.Serialize(estado, OpcionesJson));
        var participacion = documento.RootElement.GetProperty("ronda").GetProperty("participacion");

        Assert.True(participacion.GetProperty("respondio").GetBoolean());
        Assert.Equal(75, participacion.GetProperty("estimacion").GetInt64());
        Assert.Equal(recibidaEn, participacion.GetProperty("recibidaEn").GetDateTimeOffset());
    }

    [Fact]
    public void EstadosPosteriores_UsanLasVariantesDefinidasPorElContrato()
    {
        var ahora = DateTimeOffset.Parse("2026-10-03T16:00:31Z");
        var resultados = new EstadoResultados(1, "ABCDE", "RESULTADOS", 5, ahora, "ANFITRION", 2000, new ResumenEstadoResultados(2, 1, true, true, false));
        var finalizada = new EstadoFinalizada(1, "ABCDE", "FINALIZADA", 10, ahora, "JUGADOR", 2000, ahora, true);

        using var documentoResultados = JsonDocument.Parse(JsonSerializer.Serialize(resultados, OpcionesJson));
        using var documentoFinalizada = JsonDocument.Parse(JsonSerializer.Serialize(finalizada, OpcionesJson));

        Assert.Equal("RESULTADOS", documentoResultados.RootElement.GetProperty("estado").GetString());
        Assert.True(documentoResultados.RootElement.GetProperty("resultados").GetProperty("puedeAvanzar").GetBoolean());
        Assert.Equal("FINALIZADA", documentoFinalizada.RootElement.GetProperty("estado").GetString());
        Assert.True(documentoFinalizada.RootElement.GetProperty("rankingDisponible").GetBoolean());
    }
}
