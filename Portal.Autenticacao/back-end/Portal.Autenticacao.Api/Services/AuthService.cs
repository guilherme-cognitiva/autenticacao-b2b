using System.Data;
using Portal.Autenticacao.Api.Data;
using Portal.Autenticacao.Api.Exceptions;
using Portal.Autenticacao.Api.Models.Dto.Input;
using Portal.Autenticacao.Api.Models.Dto.Output;
using Portal.Autenticacao.Api.Models.Entity;
using Portal.Autenticacao.Api.Repositories.Interfaces;
using Portal.Autenticacao.Api.Services.Interfaces;

namespace Portal.Autenticacao.Api.Services;

public sealed class AuthService(
    IUsuarioRepository usuarioRepository,
    IEmpresaRepository empresaRepository,
    IPerfilRepository perfilRepository,
    IDbConnectionFactory connectionFactory,
    IPasswordHasher passwordHasher,
    IJwtTokenService tokenService) : IAuthService
{
    public async Task<LoginOutput> LoginAsync(LoginInput input, CancellationToken cancellationToken)
    {
        var email = ServiceValidation.RequiredEmail(input.Email, "Email");
        var senha = ServiceValidation.RequiredSenha(input.Senha);

        var usuario = await usuarioRepository.ObterPorEmailAsync(email, cancellationToken);
        if (usuario is null || !passwordHasher.Verify(senha, usuario.SenhaHash))
        {
            throw new DomainException("Email ou senha invalidos.", StatusCodes.Status401Unauthorized);
        }

        if (!string.Equals(usuario.Status, "ATIVO", StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException("Usuario inativo. Contate o administrador da sua empresa.", StatusCodes.Status403Forbidden);
        }

        var empresa = await empresaRepository.ObterPorIdAsync(usuario.EmpresaId, cancellationToken)
            ?? throw new DomainException("Empresa do usuario nao encontrada.", StatusCodes.Status404NotFound);

        var perfis = await empresaRepository.ListarPerfisDaEmpresaAsync(empresa.Id, cancellationToken);
        var (token, expiraEm) = tokenService.Gerar(usuario, perfis);

        return new LoginOutput
        {
            Token = token,
            ExpiraEm = expiraEm,
            Usuario = usuario.ToOutput(),
            Empresa = empresa.ToOutput(perfis)
        };
    }

    public async Task<LoginOutput> RegistrarAsync(RegistroInput input, CancellationToken cancellationToken)
    {
        var razaoSocial = ServiceValidation.Required(input.Empresa.RazaoSocial, "Razao social", 255);
        var nomeFantasia = ServiceValidation.Optional(input.Empresa.NomeFantasia, "Nome fantasia", 255);
        var cnpj = ServiceValidation.RequiredCnpj(input.Empresa.Cnpj);
        var emailEmpresa = ServiceValidation.RequiredEmail(input.Empresa.Email, "Email da empresa");
        var telefoneEmpresa = ServiceValidation.Optional(input.Empresa.Telefone, "Telefone da empresa", 20);

        if (input.Empresa.Perfis.Count == 0)
        {
            throw new DomainException("Selecione ao menos um perfil para a empresa.");
        }

        var cidade = ServiceValidation.Required(input.Endereco.Cidade, "Cidade", 100);
        var estado = ServiceValidation.RequiredEstado(input.Endereco.Estado);
        var cep = ServiceValidation.RequiredCep(input.Endereco.Cep);

        var nomeUsuario = ServiceValidation.Required(input.Usuario.Nome, "Nome do usuario", 150);
        var emailUsuario = ServiceValidation.RequiredEmail(input.Usuario.Email, "Email do usuario");
        var senha = ServiceValidation.RequiredSenha(input.Usuario.Senha);
        var telefoneUsuario = ServiceValidation.Optional(input.Usuario.Telefone, "Telefone do usuario", 20);

        var perfis = await perfilRepository.ObterPorNomesAsync(input.Empresa.Perfis, cancellationToken);
        if (perfis.Count != input.Empresa.Perfis.Distinct(StringComparer.OrdinalIgnoreCase).Count())
        {
            throw new DomainException("Um ou mais perfis informados nao existem. Use FORNECEDOR, COMPRADOR ou TRANSPORTADORA.");
        }

        if (await empresaRepository.ObterPorCnpjOuEmailAsync(cnpj, emailEmpresa, cancellationToken) is not null)
        {
            throw new DomainException("Ja existe uma empresa com esse CNPJ ou email.", StatusCodes.Status409Conflict);
        }
        if (await usuarioRepository.EmailExisteAsync(emailUsuario, cancellationToken))
        {
            throw new DomainException("Ja existe um usuario com esse email.", StatusCodes.Status409Conflict);
        }

        var senhaHash = passwordHasher.Hash(senha);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        Empresa empresaCriada;
        Usuario usuarioCriado;

        try
        {
            empresaCriada = await empresaRepository.CriarAsync(new Empresa
            {
                RazaoSocial = razaoSocial,
                NomeFantasia = nomeFantasia,
                Cnpj = cnpj,
                Email = emailEmpresa,
                Telefone = telefoneEmpresa,
                Status = "ATIVO"
            }, connection, transaction, cancellationToken);

            await empresaRepository.VincularPerfisAsync(empresaCriada.Id, perfis.Select(p => p.Id), connection, transaction, cancellationToken);

            await empresaRepository.CriarEnderecoAsync(new Endereco
            {
                EmpresaId = empresaCriada.Id,
                Cidade = cidade,
                Estado = estado,
                Cep = cep
            }, connection, transaction, cancellationToken);

            usuarioCriado = await usuarioRepository.CriarAsync(new Usuario
            {
                EmpresaId = empresaCriada.Id,
                Nome = nomeUsuario,
                Email = emailUsuario,
                SenhaHash = senhaHash,
                Telefone = telefoneUsuario,
                Status = "ATIVO"
            }, connection, transaction, cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        var nomesPerfis = perfis.Select(p => p.Nome).OrderBy(n => n).ToArray();
        var (token, expiraEm) = tokenService.Gerar(usuarioCriado, nomesPerfis);

        return new LoginOutput
        {
            Token = token,
            ExpiraEm = expiraEm,
            Usuario = usuarioCriado.ToOutput(),
            Empresa = empresaCriada.ToOutput(nomesPerfis)
        };
    }

    public async Task<UsuarioOutput> ObterAtualAsync(Guid usuarioId, CancellationToken cancellationToken)
    {
        var usuario = await usuarioRepository.ObterPorIdAsync(usuarioId, cancellationToken)
            ?? throw new DomainException("Usuario nao encontrado.", StatusCodes.Status404NotFound);
        return usuario.ToOutput();
    }

    public async Task<IReadOnlyCollection<PerfilOutput>> ListarPerfisAsync(CancellationToken cancellationToken)
    {
        var perfis = await perfilRepository.ListarAsync(cancellationToken);
        return [.. perfis.Select(p => p.ToOutput())];
    }
}
