namespace Portal.Autenticacao.Api.Models.Dto.Input;

public sealed class LoginInput
{
    public string Email { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
}
