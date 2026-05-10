using Portal.Autenticacao.Api.Models.Entity;

namespace Portal.Autenticacao.Api.Repositories.Interfaces;

public interface IPerfilRepository
{
    Task<IReadOnlyCollection<Perfil>> ListarAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Perfil>> ObterPorNomesAsync(IEnumerable<string> nomes, CancellationToken cancellationToken);
}
