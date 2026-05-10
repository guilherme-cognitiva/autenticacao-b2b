namespace Portal.Autenticacao.Api.Models.Dto.Output;

public sealed class LoginOutput
{
    public string Token { get; init; } = string.Empty;
    public DateTimeOffset ExpiraEm { get; init; }
    public UsuarioOutput Usuario { get; init; } = new();
    public EmpresaOutput Empresa { get; init; } = new();
}
