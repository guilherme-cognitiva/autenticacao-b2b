using Dapper;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Portal.Autenticacao.Api.Data;

namespace Portal.Autenticacao.Api.HealthChecks;

public sealed class PostgresHealthCheck(IDbConnectionFactory connectionFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
            var result = await connection.ExecuteScalarAsync<int>(new CommandDefinition("select 1;", cancellationToken: cancellationToken));
            return result == 1
                ? HealthCheckResult.Healthy("Postgres OK")
                : HealthCheckResult.Unhealthy("Resposta inesperada do Postgres");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Falha ao conectar no Postgres", ex);
        }
    }
}
