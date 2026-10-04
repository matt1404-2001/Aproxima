using System.Text.Json.Serialization;

namespace EstimateArena.Application.Partidas;

public interface IPartidasServicio
{
    Task<PartidaCreada> CrearAsync(CancellationToken cancellationToken);
    Task<JugadorIngresado> IngresarAsync(string codigo, string nombre, CancellationToken cancellationToken);
    Task<TransicionPartida> IniciarAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<EstimacionAceptada> EnviarEstimacionAsync(long partidaId, long rondaId, long valor, SesionActual sesion, CancellationToken cancellationToken);
    Task<ResultadosRonda> ConsultarResultadosAsync(long partidaId, long rondaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<RankingPartida> ConsultarRankingAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<TransicionPartida> AvanzarAsync(long partidaId, long rondaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<PartidaFinalizada> FinalizarAsync(long partidaId, long rondaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<SesionRecuperada> RecuperarSesionAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken);
    Task<object> ConsultarEstadoAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken);
}

public sealed record SesionActual(long PartidaId, string Rol, long? JugadorId);
public sealed record PartidaCreada(long PartidaId, string Codigo, string Estado, int TotalRondas, int DuracionRondaSegundos, int MaximoJugadores, string TokenAnfitrion);
public sealed record JugadorResumen(long JugadorId, string Nombre);
public sealed record JugadorIngresado(long PartidaId, string Codigo, string Estado, JugadorResumen Jugador, string TokenJugador);
public sealed record SesionRecuperada(string Rol, JugadorResumen? Jugador, object EstadoPartida);
public sealed record EstadoLobby(long PartidaId, string Codigo, string Estado, long VersionEstado, DateTimeOffset ServidorAhora, string Rol, int PollingSugeridoMs, LobbyDetalle Lobby);
public sealed record LobbyDetalle(int CantidadJugadores, int MinimoJugadores, int MaximoJugadores, bool PuedeIniciar, IReadOnlyList<JugadorResumen> Jugadores);
public sealed record EstadoRondaActiva(long PartidaId, string Codigo, string Estado, long VersionEstado, DateTimeOffset ServidorAhora, string Rol, int PollingSugeridoMs, RondaActiva Ronda);
public sealed record RondaActiva(long RondaId, int Numero, int TotalRondas, string Enunciado, string Unidad, DateTimeOffset IniciadaEn, DateTimeOffset FinalizaEn, ParticipacionRonda? Participacion);
public sealed record ParticipacionRonda(bool Respondio, long? Estimacion, DateTimeOffset? RecibidaEn);
public sealed record EstadoResultados(long PartidaId, string Codigo, string Estado, long VersionEstado, DateTimeOffset ServidorAhora, string Rol, int PollingSugeridoMs, ResumenEstadoResultados Resultados);
public sealed record ResumenEstadoResultados(long RondaId, int Numero, bool ResultadosDisponibles, bool PuedeAvanzar, bool PuedeFinalizar);
public sealed record EstadoFinalizada(long PartidaId, string Codigo, string Estado, long VersionEstado, DateTimeOffset ServidorAhora, string Rol, int PollingSugeridoMs, DateTimeOffset FinalizadaEn, bool RankingDisponible);
public sealed record TransicionPartida(string Mensaje, object EstadoPartida);
public sealed record EstimacionAceptada(long EstimacionId, long PartidaId, long RondaId, long Valor, DateTimeOffset RecibidaEn, string EstadoPartida, string Mensaje);
public sealed record ResultadosRonda(long PartidaId, long RondaId, int Numero, int TotalRondas, string Enunciado, string Unidad, long RespuestaCorrecta, string MotivoCierre, DateTimeOffset CerradaEn, EstadisticasRonda Estadisticas, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] ResultadoPersonal? ResultadoPersonal, string? Explicacion, string? Fuente, DateTimeOffset ServidorAhora);
public sealed record EstadisticasRonda(bool HayRespuestas, int CantidadRespuestas, int TotalJugadores, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] long? EstimacionMinima, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] decimal? Promedio, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] long? EstimacionMaxima);
public sealed record ResultadoPersonal(bool Respondio, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] long? Estimacion, [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] long? DiferenciaAbsoluta, int Puntos);
public sealed record RankingPartida(long PartidaId, string Tipo, int RondasCompletadas, int TotalRondas, IReadOnlyList<EntradaRanking> Posiciones, DateTimeOffset ServidorAhora);
public sealed record EntradaRanking(int Posicion, long JugadorId, string Nombre, int PuntosTotales, bool EsJugadorActual);
public sealed record PartidaFinalizada(string Mensaje, string Estado, DateTimeOffset FinalizadaEn, RankingPartida Ranking);
