# Autenticação — Fluxo, JWT e Integração

## 1. Visão geral do fluxo

```
┌──────────┐  POST /auth/login          ┌────────────────┐
│ Front    │ ─────────────────────────→ │ usuarios-      │
│ (React)  │                            │ service        │
│          │ ←───────── JWT + dados ─── │ (porta 5001)   │
└──────────┘                            └────────┬───────┘
                                                 │ valida BCrypt
                                                 ▼
                                        ┌────────────────┐
                                        │ portal_b2b.    │
                                        │ usuario        │
                                        └────────────────┘

(em chamadas seguintes a outros microsserviços:)

┌──────────┐  Authorization: Bearer ... ┌────────────────┐
│ Front    │ ─────────────────────────→ │ produtos-      │
│ (React)  │                            │ service        │
│          │                            │ (porta 5002)   │
└──────────┘                            └────────┬───────┘
                                                 │ valida JWT
                                                 │ (mesma JWT_SECRET)
                                                 ▼
                                        usa claims:
                                          - sub (id usuario)
                                          - empresa_id
                                          - role[]
```

## 2. Algoritmo e geração

| Item | Valor |
|---|---|
| Algoritmo | **HS256** (HMAC com SHA-256) |
| Tempo de vida | `JWT_EXPIRATION_MINUTES` minutos (padrão: **240** = 4h) |
| Hash de senha | **BCrypt** com `workFactor = 12` |
| Implementação | `JwtTokenService` ([Services/JwtTokenService.cs](../back-end/Portal.Autenticacao.Api/Services/JwtTokenService.cs)) |

A chave secreta vem da env `JWT_SECRET` (mínimo 32 chars). **Todos os microsserviços do Portal B2B precisam usar a MESMA chave** para conseguir validar tokens emitidos por este serviço.

## 3. Estrutura do token (claims)

Decodificando um token em https://jwt.io, você verá:

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
```json
{
  "sub": "8f3b2e1a-9c4d-4f5e-b6a7-1d2e3f4a5b6c",
  "email": "guilherme@empresax.com.br",
  "name": "Guilherme Miranda",
  "empresa_id": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
  "role": ["FORNECEDOR", "TRANSPORTADORA"],
  "jti": "8a3c7d12-9b4e-4a1f-bc6d-2e5f8a9b0c1d",
  "iss": "portal-autenticacao",
  "aud": "portal-b2b",
  "exp": 1746899400,
  "nbf": 1746885000
}
```

### Significado das claims

| Claim | Significado | Uso |
|---|---|---|
| `sub` | Subject — UUID do usuário (`portal_b2b.usuario.id`) | Identificar quem está fazendo a request |
| `email` | Email do usuário | Logs, auditoria |
| `name` | Nome completo do usuário | UI / logs |
| `empresa_id` | UUID da empresa do usuário | **Filtrar dados por empresa** (multitenant) |
| `role` | Array com perfis da empresa | Autorização (`[Authorize(Roles = "FORNECEDOR")]`) |
| `jti` | JWT ID único | Revogação futura (blacklist) |
| `iss` | Issuer | Quem emitiu (validado pelos outros services) |
| `aud` | Audience | Pra quem é destinado |
| `exp` | Expiration time (UNIX) | Expiração |
| `nbf` | Not before (UNIX) | Início de validade |

> **Importante:** as roles vêm dos perfis da **empresa** (não do usuário individual). O modelo do banco assume que todos os usuários de uma empresa herdam os perfis dela.

## 4. Como o front-end consome

### Login → guarda sessão

Em [src/lib/auth-store.ts](../front-end/src/lib/auth-store.ts), o Zustand store guarda:
- `localStorage["auth_token"]` — o JWT bruto
- `localStorage["auth_session"]` — `{ expiraEm, usuario, empresa }` em JSON

### Cada request anexa o Bearer token

Interceptor configurado em [src/api/authApi.ts](../front-end/src/api/authApi.ts):

```ts
authHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Quando você criar clients para outros microsserviços (produtos, pedidos…), use o mesmo padrão.

### Rotas protegidas no front

Em [src/main.tsx](../front-end/src/main.tsx), o componente `RequireAuth` verifica o token no Zustand:

```tsx
function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}
```

Rotas como `/dashboard` ficam dentro de `<RequireAuth>`. Se o token não existe, redireciona pra `/login`.

## 5. Como outros microsserviços validam o token

Cada microsserviço (produtos, pedidos, etc.) precisa configurar o JWT Bearer no `Program.cs`:

```csharp
// Program.cs do produtos-service (exemplo)
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "portal-autenticacao",      // mesmo do auth
            ValidAudience = "portal-b2b",             // mesmo do auth
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!)
                // ↑ MESMA JWT_SECRET configurada no usuarios-service
            )
        };
    });
builder.Services.AddAuthorization();
```

E no controller, basta adicionar `[Authorize]`:

```csharp
[Authorize]
[HttpPost]
public async Task<IActionResult> Criar([FromBody] ProdutoInput input)
{
    // Acesso aos dados do JWT:
    var usuarioId = Guid.Parse(User.FindFirst("sub")!.Value);
    var empresaId = Guid.Parse(User.FindFirst("empresa_id")!.Value);
    var temPerfilFornecedor = User.IsInRole("FORNECEDOR");

    // Use empresaId para filtrar tudo por tenant:
    // INSERT INTO produto (..., empresa_id) VALUES (..., @empresaId);
    // ...
}
```

### Configuração compartilhada (recomendado)

Padronize entre todos os microsserviços usando o mesmo bloco no `appsettings.json`:

```json
{
  "Jwt": {
    "Issuer": "portal-autenticacao",
    "Audience": "portal-b2b",
    "SecretKey": "<mesma chave em TODOS os microsservicos>"
  }
}
```

Em produção, injete via env `JWT_SECRET` em todos eles.

## 6. Renovação / refresh

**Não há refresh token implementado.** Quando o token expira (4h por padrão), o usuário precisa fazer login novamente.

Se quiser implementar refresh no futuro:
1. Emitir um `refresh_token` opaco junto com o JWT
2. Guardá-lo numa tabela `usuario_refresh_token` (id, usuario_id, token_hash, expires_at)
3. Endpoint `POST /auth/refresh` que recebe o refresh, valida e emite novo JWT

## 7. Logout

**Não há endpoint de logout.** O logout é feito 100% no front-end:
1. Limpa `localStorage` (token + sessão)
2. Reset do Zustand store
3. Redirect pra `/login`

Implementado em `useAuthStore.clear()` ([src/lib/auth-store.ts](../front-end/src/lib/auth-store.ts)).

Como JWT é stateless, não há como "invalidar" um token específico antes da expiração — a única forma seria implementar uma blacklist usando a claim `jti` (não implementado).

## 8. Hash de senha (BCrypt)

```csharp
// Cadastro: hash da senha plaintext
string hash = BCrypt.Net.BCrypt.HashPassword("senha123", workFactor: 12);
// Resultado: "$2a$12$abcdefghij...XYZ" (60 chars)

// Login: verifica
bool valido = BCrypt.Net.BCrypt.Verify("senha123", hash);
```

- `workFactor: 12` significa 2¹² = 4096 iterações (~250ms por hash)
- O salt vai embutido no próprio hash
- O hash final fica em `portal_b2b.usuario.senha_hash` (`TEXT` no banco)

## 9. Boas práticas observadas

- ✅ Senhas nunca retornam em nenhum endpoint
- ✅ Hash com BCrypt + work factor adequado
- ✅ Token assinado com HS256 + chave longa (≥32 chars)
- ✅ Validação completa do token em todos os endpoints protegidos
- ✅ CORS restrito a origens explícitas (`CORS_ALLOWED_ORIGINS`)
- ✅ Microsserviço usa user `svc_portal_b2b` (DML only) — segue regra do trabalho
- ✅ Tratamento global de exceções (não vaza stack traces)
- ⚠️ Não implementado: refresh token, rate limiting, lockout após N tentativas, MFA. Considerar para produção real.
