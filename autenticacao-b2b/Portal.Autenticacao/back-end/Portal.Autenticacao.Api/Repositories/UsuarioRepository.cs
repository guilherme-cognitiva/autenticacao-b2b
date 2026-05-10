using Dapper;
using Npgsql;
using Portal.Autenticacao.Api.Data;
using Portal.Autenticacao.Api.Models.Entity;
using Portal.Autenticacao.Api.Repositories.Interfaces;

namespace Portal.Autenticacao.Api.Repositories;

public sealed class UsuarioRepository(IDbConnectionFactory connectionFactory) : IUsuarioRepository
{
    public async Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancellationToken)
    {
        var sql = $"select * from {DatabaseIdentifiers.Usuario} where lower(email) = lower(@email);";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Usuario>(new CommandDefinition(sql, new { email }, cancellationToken: cancellationToken));
    }

    public async Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var sql = $"select * from {DatabaseIdentifiers.Usuario} where id = @id;";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Usuario>(new CommandDefinition(sql, new { id }, cancellationToken: cancellationToken));
    }

    public async Task<bool> EmailExisteAsync(string email, CancellationToken cancellationToken)
    {
        var sql = $"select exists(select 1 from {DatabaseIdentifiers.Usuario} where lower(email) = lower(@email));";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new { email }, cancellationToken: cancellationToken));
    }

    public async Task<Usuario> CriarAsync(Usuario usuario, NpgsqlConnection connection, NpgsqlTransaction transaction, CancellationToken cancellationToken)
    {
        var sql = $"""
            insert into {DatabaseIdentifiers.Usuario}
                (empresa_id, nome, email, senha_hash, telefone, status)
            values
                (@empresaId, @nome, @email, @senhaHash, @telefone, @status)
            returning *;
            """;

        return await connection.QuerySingleAsync<Usuario>(new CommandDefinition(sql, usuario, transaction: transaction, cancellationToken: cancellationToken));
    }
}
