# Arquitetura

## 1. Visão geral

```
┌────────────────────────────────────────────────────────────┐
│                     Front-end (React + Vite)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Login   │  │ Registro │  │Dashboard │  │  Toggle  │    │
│  │  /login  │  │/registro │  │/dashboard│  │  Tema    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                            │
│  axios + Zustand store (JWT em localStorage)               │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTP (proxy /api → :5001)
                       ▼
┌────────────────────────────────────────────────────────────┐
│                Back-end (.NET 10 Web API)                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Controllers  │  │  Services   │  │  Repositories    │   │
│  │  - Auth      │→ │  - Auth     │→ │  - Usuario       │   │
│  └──────────────┘  │  - JwtToken │  │  - Empresa       │   │
│                    │  - Password │  │  - Perfil        │   │
│                    └─────────────┘  └──────────────────┘   │
│                                                            │
│  Middleware: GlobalExceptionHandler                        │
│  Auth: JWT Bearer (HS256)                                  │
└──────────────────────┬─────────────────────────────────────┘
                       │ Dapper + Npgsql
                       ▼
┌────────────────────────────────────────────────────────────┐
│            PostgreSQL (compartilhado)                      │
│            Schema: portal_b2b                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────────┐  ┌─────────┐   │
│  │ usuario │  │ empresa │  │empresa_perfil│  │ perfil  │   │
│  └─────────┘  └─────────┘  └──────────────┘  └─────────┘   │
│       └──────────┴──────────────────┘                      │
│                  ┌─────────┐                               │
│                  │endereco │                               │
│                  └─────────┘                               │
└────────────────────────────────────────────────────────────┘
```

## 2. Estrutura de pastas

```
Portal.Autenticacao/
├── README.md
├── docs/                              ← você está aqui
│   ├── README.md                      (índice)
│   ├── API.md                         (endpoints)
│   ├── AUTENTICACAO.md                (JWT + integração)
│   ├── ARQUITETURA.md
│   └── DEPLOY.md
│
├── back-end/
│   ├── Portal.Autenticacao.Api.slnx
│   └── Portal.Autenticacao.Api/
│       ├── Portal.Autenticacao.Api.csproj
│       ├── Program.cs
│       ├── appsettings.json
│       ├── .env.example
│       │
│       ├── Configuration/
│       │   └── JwtOptions.cs
│       │
│       ├── Controllers/
│       │   └── AuthController.cs       (login, registro, perfis, me)
│       │
│       ├── Data/
│       │   ├── DatabaseIdentifiers.cs  (qualifica tabelas com schema)
│       │   ├── EnvFileLoader.cs        (carrega .env)
│       │   ├── IDbConnectionFactory.cs
│       │   ├── NpgsqlConnectionFactory.cs
│       │   └── PostgresConnectionStringResolver.cs
│       │
│       ├── Exceptions/
│       │   └── DomainException.cs      (exceção de domínio com status)
│       │
│       ├── HealthChecks/
│       │   └── PostgresHealthCheck.cs
│       │
│       ├── Middlewares/
│       │   └── GlobalExceptionHandlerMiddleware.cs
│       │
│       ├── Models/
│       │   ├── Dto/
│       │   │   ├── Input/
│       │   │   │   ├── LoginInput.cs
│       │   │   │   └── RegistroInput.cs
│       │   │   └── Output/
│       │   │       ├── LoginOutput.cs
│       │   │       └── UsuarioOutput.cs
│       │   ├── Entity/
│       │   │   ├── Empresa.cs
│       │   │   ├── Endereco.cs
│       │   │   ├── Perfil.cs
│       │   │   └── Usuario.cs
│       │   └── Responses/
│       │       └── ApiResponse.cs
│       │
│       ├── Repositories/
│       │   ├── EmpresaRepository.cs
│       │   ├── PerfilRepository.cs
│       │   ├── UsuarioRepository.cs
│       │   └── Interfaces/
│       │       ├── IEmpresaRepository.cs
│       │       ├── IPerfilRepository.cs
│       │       └── IUsuarioRepository.cs
│       │
│       └── Services/
│           ├── AuthService.cs           (orquestra login + registro)
│           ├── JwtTokenService.cs       (gera o JWT)
│           ├── IPasswordHasher.cs       (BCrypt)
│           ├── MappingExtensions.cs     (entity → DTO)
│           ├── ServiceValidation.cs     (validações reutilizáveis)
│           └── Interfaces/
│               └── IAuthService.cs
│
└── front-end/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── index.html
    │
    └── src/
        ├── main.tsx                     (router + providers)
        ├── index.css                    (paleta + dark mode)
        │
        ├── api/
        │   └── authApi.ts               (axios + endpoints)
        │
        ├── components/
        │   ├── theme-provider.tsx
        │   ├── theme-toggle.tsx
        │   ├── auth/
        │   │   └── AuthShell.tsx        (layout das telas auth)
        │   └── ui/                       (49 componentes shadcn)
        │
        ├── hooks/
        │   ├── use-mobile.tsx
        │   └── use-toast.ts
        │
        ├── lib/
        │   ├── auth-store.ts            (Zustand: sessão JWT)
        │   └── utils.ts
        │
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegistroPage.tsx          (3 abas: empresa → endereço → usuário)
        │   └── DashboardPage.tsx
        │
        └── types/
            └── auth.ts                   (DTOs equivalentes ao back)
```

## 3. Padrões adotados

### Back-end: Controller → Service → Repository

```
HTTP Request
   │
   ▼
[Controller]   ← validação básica de modelo, sem regra de negócio
   │
   ▼
[Service]      ← regras de negócio, orquestração de transações,
   │              validações de domínio (lança DomainException)
   ▼
[Repository]   ← acesso ao banco via Dapper, SQL puro,
                  retorna entities
```

- **Controllers** são finos: só recebem HTTP, chamam o service, embrulham em `ApiResponse<T>`.
- **Services** têm a lógica: validam (`ServiceValidation`), orquestram (transações), mapeiam (`MappingExtensions`), publicam eventos (não usado aqui, mas no exemplo `produtos-service` publica em Kafka).
- **Repositories** são puro acesso a dados: Dapper + SQL, sem regra de negócio. Aceitam `NpgsqlConnection` + `NpgsqlTransaction` opcionais para participar de transações orquestradas no service.

### Tratamento de erro

`GlobalExceptionHandlerMiddleware` captura:
- `DomainException` → retorna `ApiResponse.Fail(...)` com o status apropriado (400, 401, 403, 404…)
- `PostgresException` com `UniqueViolation` → 409 Conflict automático
- `PostgresException` com `ForeignKeyViolation` → 400 Bad Request
- Qualquer outra → 500 + log no Serilog

Resultado: nenhum endpoint precisa de `try/catch` boilerplate.

### Naming

- **Banco**: `snake_case` (`razao_social`, `data_cadastro`)
- **C#**: `PascalCase` para entidades/DTOs (`RazaoSocial`, `DataCadastro`)
- **Mapeamento**: feito automaticamente via `DefaultTypeMap.MatchNamesWithUnderscores = true` no `Program.cs`

### Front-end

- **Páginas em `/pages`**, layouts em `/components/auth`, primitivos em `/components/ui` (shadcn)
- **`react-hook-form` + `zod`** para formulários (validação tipada)
- **`@tanstack/react-query`** para queries (cache, invalidação, retries)
- **Zustand** para estado global (apenas a sessão)
- **`sonner`** para toasts
- **Axios** com interceptor que anexa `Bearer token`

## 4. Banco de dados

### Tabelas usadas (já existentes — não criamos)

| Tabela | Função |
|---|---|
| `portal_b2b.perfil` | Catálogo de perfis (FORNECEDOR, COMPRADOR, TRANSPORTADORA) — pré-populada |
| `portal_b2b.empresa` | Empresas cadastradas |
| `portal_b2b.empresa_perfil` | N:N entre empresa e perfil |
| `portal_b2b.usuario` | Usuários, com `senha_hash` (BCrypt) e FK pra empresa |
| `portal_b2b.endereco` | Endereços da empresa |

### Conexão

Centralizada em `PostgresConnectionStringResolver`:
1. Tenta `DATABASE_URL` (formato `postgresql://user:pass@host:port/db`)
2. Se não, tenta `POSTGRESQL_HOST/PORT/DATABASE/USER/PASSWORD`
3. Se não, usa `ConnectionStrings:DefaultConnection` do `appsettings.json`

Sempre aplica `SearchPath = portal_b2b` se a env `DB_SCHEMA` estiver setada.

### Pool de conexão

Usa `NpgsqlDataSource` (singleton) com pooling habilitado, max 100 conexões. Cada repository pega uma conexão via `IDbConnectionFactory`.

### Transações

O registro (`AuthService.RegistrarAsync`) usa transação explícita:

```csharp
await using var connection = await connectionFactory.OpenConnectionAsync(ct);
await using var transaction = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);
try
{
    // empresa → empresa_perfil → endereco → usuario
    await transaction.CommitAsync(ct);
}
catch
{
    await transaction.RollbackAsync(ct);
    throw;
}
```

Garante atomicidade: ou tudo é gravado, ou nada.

## 5. Stack completa

### Back-end (.NET)

| Pacote | Versão | Função |
|---|---|---|
| `Microsoft.NET.Sdk.Web` | 10.0 | Web API |
| `Dapper` | 2.1.66 | Micro-ORM (SQL puro com mapeamento) |
| `Npgsql` | 9.0.3 | Driver PostgreSQL |
| `BCrypt.Net-Next` | 4.0.3 | Hash de senha |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 9.0.0 | JWT |
| `Serilog.AspNetCore` | 8.0.1 | Logging estruturado |
| `Swashbuckle.AspNetCore` | 6.6.2 | Swagger UI |

### Front-end (React)

| Pacote | Versão | Função |
|---|---|---|
| `react` | 18.3 | UI |
| `react-router-dom` | 6.30 | Roteamento |
| `axios` | 1.12 | HTTP client |
| `@tanstack/react-query` | 5.83 | Cache/queries |
| `react-hook-form` | 7.61 | Forms |
| `zod` | 3.25 | Validação tipada |
| `@hookform/resolvers` | 3.10 | Cola RHF + Zod |
| `zustand` | 5.0 | Estado global |
| `sonner` | 1.7 | Toasts |
| `tailwindcss` | 3.4 | CSS |
| `@radix-ui/*` | várias | Primitivos do shadcn |
| `lucide-react` | 0.462 | Ícones |
| `next-themes` | 0.3 | Dark/light mode |

## 6. Decisões de design

| Decisão | Por quê |
|---|---|
| Dapper em vez de EF Core | Padrão do exemplo `SDI.Micro.Produto`. Mais explícito, menos mágica, mais performance |
| Transação explícita no service (não no repository) | Repository deve ser orquestrável — o service que sabe quando tudo precisa ser atômico |
| `DefaultTypeMap.MatchNamesWithUnderscores` | Convenção snake_case no banco x PascalCase no C# sem precisar de attributes |
| `ApiResponse<T>` em todos os endpoints | Padrão consistente do trabalho — front sempre pode olhar `mensagem`/`erros`/`resultado` |
| BCrypt em vez de Argon2 | Mais simples, biblioteca .NET madura, mais que suficiente para o escopo |
| JWT em vez de cookie | Microsserviços conseguem validar sem chamar o usuarios-service |
| Cadastro = empresa + endereço + usuário em 1 endpoint | Schema do banco exige `empresa_id NOT NULL` em `usuario`. Cadastro fragmentado quebraria atomicidade |
| Front com `react-router` + `Zustand` | Múltiplas rotas (login, registro, dashboard) e sessão persistente |
