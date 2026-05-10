using Portal.Autenticacao.Api.Models.Dto.Output;
using Portal.Autenticacao.Api.Models.Entity;

namespace Portal.Autenticacao.Api.Services;

internal static class MappingExtensions
{
    public static UsuarioOutput ToOutput(this Usuario usuario) => new()
    {
        Id = usuario.Id,
        EmpresaId = usuario.EmpresaId,
        Nome = usuario.Nome,
        Email = usuario.Email,
        Telefone = usuario.Telefone,
        Status = usuario.Status,
        DataCadastro = usuario.DataCadastro
    };

    public static EmpresaOutput ToOutput(this Empresa empresa, IReadOnlyCollection<string>? perfis = null) => new()
    {
        Id = empresa.Id,
        RazaoSocial = empresa.RazaoSocial,
        NomeFantasia = empresa.NomeFantasia,
        Cnpj = empresa.Cnpj,
        Email = empresa.Email,
        Telefone = empresa.Telefone,
        Status = empresa.Status,
        Perfis = perfis ?? []
    };

    public static PerfilOutput ToOutput(this Perfil perfil) => new()
    {
        Id = perfil.Id,
        Nome = perfil.Nome
    };
}
