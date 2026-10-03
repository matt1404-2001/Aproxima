namespace EstimateArena.Application.Partidas;

public interface IPartidasServicio
{
    Task<PartidaCreada> CrearAsync(CancellationToken cancellationToken);
    Task<JugadorIngresado> IngresarAsync(string codigo, string nombre, CancellationToken cancellationToken);
    Task<TransicionPartida> IniciarAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken);
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
public sealed record RondaActiva(long RondaId, int Numero, int TotalRondas, string Enunciado, string Unidad, DateTimeOffset IniciadaEn, DateTimeOffset FinalizaEn, object? Participacion);
public sealed record TransicionPartida(string Mensaje, object EstadoPartida);
