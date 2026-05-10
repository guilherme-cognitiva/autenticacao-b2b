namespace Portal.Autenticacao.Api.Models.Dto.Output;

public sealed class UsuarioOutput
{
    public Guid Id { get; init; }
    public Guid EmpresaId { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Telefone { get; init; }
    public string Status { get; init; } = "ATIVO";
    public DateTimeOffset DataCadastro { get; init; }
}

public sealed class EmpresaOutput
{
    public Guid Id { get; init; }
    public string RazaoSocial { get; init; } = string.Empty;
    public string? NomeFantasia { get; init; }
    public string Cnpj { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Telefone { get; init; }
    public string Status { get; init; } = "ATIVO";
    public IReadOnlyCollection<string> Perfis { get; init; } = [];
}

public sealed class PerfilOutput
{
    public Guid Id { get; init; }
    public string Nome { get; init; } = string.Empty;
}
