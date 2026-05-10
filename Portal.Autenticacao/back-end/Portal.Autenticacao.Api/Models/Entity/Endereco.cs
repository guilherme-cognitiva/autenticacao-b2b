namespace Portal.Autenticacao.Api.Models.Entity;

public sealed class Endereco
{
    public Guid Id { get; init; }
    public Guid EmpresaId { get; init; }
    public string Cidade { get; init; } = string.Empty;
    public string Estado { get; init; } = string.Empty;
    public string Cep { get; init; } = string.Empty;
    public decimal? Latitude { get; init; }
    public decimal? Longitude { get; init; }
}
