using EstimateArena.Application.Configuracion;
using EstimateArena.Application.Errores;
using EstimateArena.Application.Partidas;
using EstimateArena.Application.Sesiones;
using EstimateArena.Domain.Partidas;
using EstimateArena.Infrastructure.Persistencia;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace EstimateArena.Infrastructure.Partidas;

public sealed class ServicioPartidas(
    EstimateArenaDbContext dbContext,
    IServicioTokensSesion tokens,
    IOptions<OpcionesPartida> opciones,
    TimeProvider timeProvider) : IPartidasServicio
{
    private const string AlfabetoCodigo = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public async Task<PartidaCreada> CrearAsync(CancellationToken cancellationToken)
    {
        var configuracion = opciones.Value;
        var desafios = await dbContext.Desafios.Where(x => x.Activo).Select(x => x.Id).ToListAsync(cancellationToken);
        if (desafios.Count < configuracion.CantidadRondas)
        {
            throw Conflicto("DESAFIOS_INSUFICIENTES", "No hay suficientes desafios disponibles para crear la partida.");
        }

        Barajar(desafios);
        var token = tokens.Crear("hst");
        var ahora = timeProvider.GetUtcNow();
        var partida = new Partida
        {
            Codigo = await GenerarCodigoAsync(cancellationToken),
            TokenAnfitrionHash = token.Hash,
            CantidadRondas = configuracion.CantidadRondas,
            DuracionRondaSegundos = configuracion.DuracionRondaSegundos,
            MaximoJugadores = configuracion.MaximoJugadores,
            FechaCreacion = ahora,
            FechaExpiracion = ahora.AddDays(configuracion.ConservacionDias)
        };

        for (var numero = 1; numero <= configuracion.CantidadRondas; numero++)
        {
            partida.Rondas.Add(new Ronda { Numero = numero, DesafioId = desafios[numero - 1] });
        }

        dbContext.Partidas.Add(partida);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new PartidaCreada(partida.Id, partida.Codigo, partida.Estado.ToString(), partida.CantidadRondas, partida.DuracionRondaSegundos, partida.MaximoJugadores, token.Valor);
    }

    public async Task<JugadorIngresado> IngresarAsync(string codigo, string nombre, CancellationToken cancellationToken)
    {
        var codigoNormalizado = codigo.Trim().ToUpperInvariant();
        var nombreNormalizado = NormalizarNombre(nombre);
        await using var transaccion = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var partida = await dbContext.Partidas.Include(x => x.Jugadores).SingleOrDefaultAsync(x => x.Codigo == codigoNormalizado, cancellationToken)
            ?? throw NoEncontrada();

        if (partida.Estado != EstadoPartida.LOBBY)
        {
            throw Conflicto("PARTIDA_NO_DISPONIBLE", "La partida ya comenzo o finalizo y no admite nuevos jugadores.");
        }

        if (partida.Jugadores.Count >= partida.MaximoJugadores)
        {
            throw Conflicto("PARTIDA_LLENA", "La partida alcanzo el maximo de jugadores.");
        }

        if (partida.Jugadores.Any(x => x.NombreNormalizado == nombreNormalizado))
        {
            throw Conflicto("NOMBRE_OCUPADO", "Ese nombre ya esta en uso. Elige otro.");
        }

        var token = tokens.Crear("ply");
        var jugador = new Jugador { Nombre = nombre.Trim(), NombreNormalizado = nombreNormalizado, TokenJugadorHash = token.Hash, FechaIngreso = timeProvider.GetUtcNow() };
        partida.Jugadores.Add(jugador);
        partida.VersionEstado++;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaccion.CommitAsync(cancellationToken);
        return new JugadorIngresado(partida.Id, partida.Codigo, partida.Estado.ToString(), new JugadorResumen(jugador.Id, jugador.Nombre), token.Valor);
    }

    public async Task<SesionRecuperada> RecuperarSesionAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken)
    {
        var estado = await ConsultarEstadoAsync(partidaId, sesion, cancellationToken);
        var jugador = sesion.JugadorId is long jugadorId
            ? await dbContext.Jugadores.AsNoTracking().Where(x => x.Id == jugadorId).Select(x => new JugadorResumen(x.Id, x.Nombre)).SingleAsync(cancellationToken)
            : null;
        return new SesionRecuperada(sesion.Rol, jugador, estado);
    }

    public async Task<EstadoLobby> ConsultarEstadoAsync(long partidaId, SesionActual sesion, CancellationToken cancellationToken)
    {
        ValidarSesionPartida(partidaId, sesion);
        var partida = await dbContext.Partidas.AsNoTracking().Include(x => x.Jugadores).SingleOrDefaultAsync(x => x.Id == partidaId, cancellationToken)
            ?? throw NoEncontrada();
        if (partida.FechaExpiracion <= timeProvider.GetUtcNow())
        {
            throw NoEncontrada();
        }

        if (partida.Estado != EstadoPartida.LOBBY)
        {
            throw Conflicto("ESTADO_PARTIDA_INCOMPATIBLE", "La partida no se encuentra en el lobby.");
        }

        var jugadores = partida.Jugadores.OrderBy(x => x.Id).Select(x => new JugadorResumen(x.Id, x.Nombre)).ToArray();
        return new EstadoLobby(partida.Id, partida.Codigo, partida.Estado.ToString(), partida.VersionEstado, timeProvider.GetUtcNow(), sesion.Rol, 2000,
            new LobbyDetalle(jugadores.Length, 2, partida.MaximoJugadores, sesion.Rol == "ANFITRION" && jugadores.Length >= 2, jugadores));
    }

    private async Task<string> GenerarCodigoAsync(CancellationToken cancellationToken)
    {
        for (var intento = 0; intento < 20; intento++)
        {
            var codigo = string.Create(5, 0, static (destino, _) =>
            {
                for (var indice = 0; indice < destino.Length; indice++) destino[indice] = AlfabetoCodigo[RandomNumberGenerator.GetInt32(AlfabetoCodigo.Length)];
            });
            if (!await dbContext.Partidas.AnyAsync(x => x.Codigo == codigo, cancellationToken)) return codigo;
        }
        throw new InvalidOperationException("No fue posible generar un codigo de partida unico.");
    }

    private static void Barajar(List<long> valores)
    {
        for (var indice = valores.Count - 1; indice > 0; indice--)
        {
            var destino = RandomNumberGenerator.GetInt32(indice + 1);
            (valores[indice], valores[destino]) = (valores[destino], valores[indice]);
        }
    }

    private static string NormalizarNombre(string nombre)
    {
        var recortado = nombre.Trim();
        if (recortado.Length is < 2 or > 20) throw DatoInvalido("nombre", "El nombre debe tener entre 2 y 20 caracteres.");
        return recortado.ToUpperInvariant();
    }

    private static void ValidarSesionPartida(long partidaId, SesionActual sesion)
    {
        if (partidaId != sesion.PartidaId) throw new ExcepcionNegocio(403, "ACCESO_DENEGADO", "No tienes autorizacion para realizar esta accion.");
    }

    private static ExcepcionNegocio NoEncontrada() => new(404, "PARTIDA_NO_ENCONTRADA", "La partida ya no esta disponible.");
    private static ExcepcionNegocio Conflicto(string codigo, string mensaje) => new(409, codigo, mensaje);
    private static ExcepcionNegocio DatoInvalido(string campo, string mensaje) => new(400, "DATOS_INVALIDOS", mensaje, campo);
}
