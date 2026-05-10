using Dapper;
using Portal.Autenticacao.Api.Data;
using Portal.Autenticacao.Api.Models.Entity;
using Portal.Autenticacao.Api.Repositories.Interfaces;

namespace Portal.Autenticacao.Api.Repositories;

public sealed class PerfilRepository(IDbConnectionFactory connectionFactory) : IPerfilRepository
{
    public async Task<IReadOnlyCollection<Perfil>> ListarAsync(CancellationToken cancellationToken)
    {
        var sql = $"select id, nome from {DatabaseIdentifiers.Perfil} order by nome;";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<Perfil>(new CommandDefinition(sql, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<IReadOnlyCollection<Perfil>> ObterPorNomesAsync(IEnumerable<string> nomes, CancellationToken cancellationToken)
    {
        var nomesNormalizados = nomes.Select(n => n.Trim().ToUpperInvariant()).Distinct().ToArray();
        if (nomesNormalizados.Length == 0)
        {
            return [];
        }

        var sql = $"select id, nome from {DatabaseIdentifiers.Perfil} where upper(nome) = any(@nomes);";
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<Perfil>(new CommandDefinition(sql, new { nomes = nomesNormalizados }, cancellationToken: cancellationToken));
        return rows.AsList();
    }
}
