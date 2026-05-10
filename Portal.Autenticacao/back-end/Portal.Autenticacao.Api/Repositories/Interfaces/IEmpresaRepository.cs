using Npgsql;
using Portal.Autenticacao.Api.Models.Entity;

namespace Portal.Autenticacao.Api.Repositories.Interfaces;

public interface IEmpresaRepository
{
    Task<Empresa?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Empresa?> ObterPorCnpjOuEmailAsync(string cnpj, string email, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<string>> ListarPerfisDaEmpresaAsync(Guid empresaId, CancellationToken cancellationToken);

    Task<Empresa> CriarAsync(Empresa empresa, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken);
    Task VincularPerfisAsync(Guid empresaId, IEnumerable<Guid> perfilIds, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken);
    Task<Endereco> CriarEnderecoAsync(Endereco endereco, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken);
}
