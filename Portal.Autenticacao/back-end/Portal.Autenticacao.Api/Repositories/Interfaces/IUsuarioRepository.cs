using Npgsql;
using Portal.Autenticacao.Api.Models.Entity;

namespace Portal.Autenticacao.Api.Repositories.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancellationToken);
    Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> EmailExisteAsync(string email, CancellationToken cancellationToken);
    Task<Usuario> CriarAsync(Usuario usuario, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken);
}
