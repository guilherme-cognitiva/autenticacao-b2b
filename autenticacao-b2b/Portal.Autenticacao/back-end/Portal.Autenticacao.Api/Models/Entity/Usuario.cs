namespace Portal.Autenticacao.Api.Models.Entity;

public sealed class Usuario
{
    public Guid Id { get; init; }
    public Guid EmpresaId { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string SenhaHash { get; init; } = string.Empty;
    public string? Telefone { get; init; }
    public string Status { get; init; } = "ATIVO";
    public DateTimeOffset DataCadastro { get; init; }
    public DateTimeOffset? UltimaAlteracao { get; init; }
}
