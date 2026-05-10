using Portal.Autenticacao.Api.Models.Dto.Input;
using Portal.Autenticacao.Api.Models.Dto.Output;

namespace Portal.Autenticacao.Api.Services.Interfaces;

public interface IAuthService
{
    Task<LoginOutput> LoginAsync(LoginInput input, CancellationToken cancellationToken);
    Task<LoginOutput> RegistrarAsync(RegistroInput input, CancellationToken cancellationToken);
    Task<UsuarioOutput> ObterAtualAsync(Guid usuarioId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PerfilOutput>> ListarPerfisAsync(CancellationToken cancellationToken);
}
