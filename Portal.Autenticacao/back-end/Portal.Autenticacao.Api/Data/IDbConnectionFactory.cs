using Npgsql;

namespace Portal.Autenticacao.Api.Data;

public interface IDbConnectionFactory
{
    ValueTask<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken = default);
}
