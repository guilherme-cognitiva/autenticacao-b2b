namespace Portal.Autenticacao.Api.Data;

public static class DatabaseIdentifiers
{
    public static string Usuario => Qualify("usuario");
    public static string Empresa => Qualify("empresa");
    public static string EmpresaPerfil => Qualify("empresa_perfil");
    public static string Endereco => Qualify("endereco");
    public static string Perfil => Qualify("perfil");

    private static string Qualify(string tableName)
    {
        var schema = Environment.GetEnvironmentVariable("DB_SCHEMA");
        return $"{QuoteIdentifier(string.IsNullOrWhiteSpace(schema) ? "portal_b2b" : schema)}.{QuoteIdentifier(tableName)}";
    }

    private static string QuoteIdentifier(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Any(c => !char.IsLetterOrDigit(c) && c != '_'))
        {
            throw new InvalidOperationException($"Identificador de banco invalido: {value}");
        }

        return $"\"{value}\"";
    }
}
