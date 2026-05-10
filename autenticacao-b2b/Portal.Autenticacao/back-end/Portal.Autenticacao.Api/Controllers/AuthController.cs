using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Portal.Autenticacao.Api.Exceptions;
using Portal.Autenticacao.Api.Models.Dto.Input;
using Portal.Autenticacao.Api.Models.Dto.Output;
using Portal.Autenticacao.Api.Models.Responses;
using Portal.Autenticacao.Api.Services.Interfaces;

namespace Portal.Autenticacao.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(IAuthService service) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginOutput>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Login([FromBody] LoginInput input, CancellationToken cancellationToken)
    {
        var result = await service.LoginAsync(input, cancellationToken);
        return Ok(ApiResponse<LoginOutput>.Ok(result, "Login realizado com sucesso."));
    }

    [HttpPost("registro")]
    [ProducesResponseType(typeof(ApiResponse<LoginOutput>), (int)HttpStatusCode.Created)]
    public async Task<IActionResult> Registrar([FromBody] RegistroInput input, CancellationToken cancellationToken)
    {
        var result = await service.RegistrarAsync(input, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<LoginOutput>.Created(result, "Cadastro realizado com sucesso."));
    }

    [HttpGet("perfis")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PerfilOutput>>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> ListarPerfis(CancellationToken cancellationToken)
    {
        var result = await service.ListarPerfisAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<PerfilOutput>>.Ok(result));
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioOutput>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> ObterAtual(CancellationToken cancellationToken)
    {
        var sub = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst("sub")?.Value
                  ?? throw new DomainException("Token invalido.", StatusCodes.Status401Unauthorized);

        if (!Guid.TryParse(sub, out var usuarioId))
        {
            throw new DomainException("Token invalido.", StatusCodes.Status401Unauthorized);
        }

        var result = await service.ObterAtualAsync(usuarioId, cancellationToken);
        return Ok(ApiResponse<UsuarioOutput>.Ok(result));
    }
}
