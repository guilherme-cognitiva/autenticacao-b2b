namespace Portal.Autenticacao.Api.Models.Dto.Input;

public sealed class RegistroInput
{
    public RegistroEmpresaInput Empresa { get; init; } = new();
    public RegistroEnderecoInput Endereco { get; init; } = new();
    public RegistroUsuarioInput Usuario { get; init; } = new();
}

public sealed class RegistroEmpresaInput
{
    public string RazaoSocial { get; init; } = string.Empty;
    public string? NomeFantasia { get; init; }
    public string Cnpj { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Telefone { get; init; }
    public IReadOnlyCollection<string> Perfis { get; init; } = [];
}

public sealed class RegistroEnderecoInput
{
    public string Cidade { get; init; } = string.Empty;
    public string Estado { get; init; } = string.Empty;
    public string Cep { get; init; } = string.Empty;
}

public sealed class RegistroUsuarioInput
{
    public string Nome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
    public string? Telefone { get; init; }
}
