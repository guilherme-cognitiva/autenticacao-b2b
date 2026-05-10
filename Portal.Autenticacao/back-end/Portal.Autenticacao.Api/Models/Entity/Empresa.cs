namespace Portal.Autenticacao.Api.Models.Entity;

public sealed class Empresa
{
    public Guid Id { get; init; }
    public string RazaoSocial { get; init; } = string.Empty;
    public string? NomeFantasia { get; init; }
    public string Cnpj { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Telefone { get; init; }
    public string Status { get; init; } = "ATIVO";
    public DateTimeOffset DataCadastro { get; init; }
    public DateTimeOffset? UltimaAlteracao { get; init; }
}
