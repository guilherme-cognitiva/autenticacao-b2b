using Dapper;
using Npgsql;
using Portal.Autenticacao.Api.Data;
using Portal.Autenticacao.Api.Models.Entity;
using Portal.Autenticacao.Api.Repositories.Interfaces;

namespace Portal.Autenticacao.Api.Repositories;

public sealed class EmpresaRepository(IDbConnectionFactory connectionFactory) : IEmpresaRepository
{
    public async Task<Empresa?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var sql = $"select * from {DatabaseIdentifiers.Empresa} where id = @id;";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Empresa>(new CommandDefinition(sql, new { id }, cancellationToken: cancellationToken));
    }

    public async Task<Empresa?> ObterPorCnpjOuEmailAsync(string cnpj, string email, CancellationToken cancellationToken)
    {
        var sql = $"""
            select * from {DatabaseIdentifiers.Empresa}
             where cnpj = @cnpj or lower(email) = lower(@email)
             limit 1;
            """;
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Empresa>(new CommandDefinition(sql, new { cnpj, email }, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyCollection<string>> ListarPerfisDaEmpresaAsync(Guid empresaId, CancellationToken cancellationToken)
    {
        var sql = $"""
            select p.nome
              from {DatabaseIdentifiers.EmpresaPerfil} ep
              join {DatabaseIdentifiers.Perfil} p on p.id = ep.perfil_id
             where ep.empresa_id = @empresaId
             order by p.nome;
            """;
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<string>(new CommandDefinition(sql, new { empresaId }, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<Empresa> CriarAsync(Empresa empresa, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken)
    {
        var sql = $"""
            insert into {DatabaseIdentifiers.Empresa}
                (razao_social, nome_fantasia, cnpj, email, telefone, status)
            values
                (@razaoSocial, @nomeFantasia, @cnpj, @email, @telefone, @status)
            returning *;
            """;

        return await connection.QuerySingleAsync<Empresa>(new CommandDefinition(sql, empresa, transaction: transaction, cancellationToken: cancellationToken));
    }

    public async Task VincularPerfisAsync(Guid empresaId, IEnumerable<Guid> perfilIds, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken)
    {
        var ids = perfilIds.Distinct().ToArray();
        if (ids.Length == 0)
        {
            return;
        }

        var sql = $"""
            insert into {DatabaseIdentifiers.EmpresaPerfil} (empresa_id, perfil_id)
            select @empresaId, perfil_id from unnest(@perfilIds) as perfil_id
            on conflict do nothing;
            """;

        await connection.ExecuteAsync(new CommandDefinition(sql, new { empresaId, perfilIds = ids }, transaction: transaction, cancellationToken: cancellationToken));
    }

    public async Task<Endereco> CriarEnderecoAsync(Endereco endereco, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken)
    {
        var sql = $"""
            insert into {DatabaseIdentifiers.Endereco}
                (empresa_id, cidade, estado, cep, latitude, longitude)
            values
                (@empresaId, @cidade, @estado, @cep, @latitude, @longitude)
            returning *;
            """;

        return await connection.QuerySingleAsync<Endereco>(new CommandDefinition(sql, endereco, transaction: transaction, cancellationToken: cancellationToken));
    }
}
