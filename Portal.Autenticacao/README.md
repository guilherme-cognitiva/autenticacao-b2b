# Portal.Autenticacao

Microserviço de autenticação do Portal B2B. Segue exatamente o mesmo padrão de arquitetura/estilo do `SDI.Micro.Produto`.

- **Back-end**: .NET 10 + Dapper + Npgsql + JWT (BCrypt para senha)
- **Front-end**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Banco**: PostgreSQL, schema `portal_b2b` (já existente)

Usa as tabelas existentes: `usuario`, `empresa`, `empresa_perfil`, `endereco`, `perfil`. **Não cria nem altera nenhuma tabela.**

---

## Endpoints

| Método | Rota              | Descrição                                           |
|--------|-------------------|-----------------------------------------------------|
| POST   | `/auth/login`     | Login com email + senha → retorna JWT               |
| POST   | `/auth/registro`  | Cria empresa + endereço + usuário admin (transação) |
| GET    | `/auth/perfis`    | Lista perfis disponíveis (FORNECEDOR/COMPRADOR/...) |
| GET    | `/auth/me`        | Dados do usuário autenticado (requer Bearer token)  |
| GET    | `/health`         | Health check do Postgres                            |

Todas as respostas seguem o padrão `ApiResponse<T>` (mesma estrutura do `SDI.Micro.Produto`).

---

## Como rodar

### 1. Back-end

```bash
cd back-end/Portal.Autenticacao.Api
cp .env.example .env       # ajuste DATABASE_URL e JWT_SECRET
dotnet restore
dotnet run
```

API sobe em `http://localhost:5001` · Swagger em `http://localhost:5001/swagger`.

### 2. Front-end

```bash
cd front-end
cp .env.example .env
npm install
npm run dev
```

Front sobe em `http://localhost:8082`. As rotas:
- `/login` — tela de login
- `/registro` — tela de cadastro de empresa em 3 abas (Empresa → Endereço → Usuário)
- `/dashboard` — tela de exemplo pós-login (mostra dados da sessão)

---

## Variáveis de ambiente importantes

### Back-end (`.env`)
```
DATABASE_URL=postgresql://svc_portal_b2b:senha@localhost:5432/portal_b2b
DB_SCHEMA=portal_b2b
JWT_SECRET=alguma_chave_longa_de_32+_caracteres
CORS_ALLOWED_ORIGINS=http://localhost:8082
```

### Front-end (`.env`)
```
VITE_AUTH_API_URL=/api
VITE_AUTH_API_TARGET=http://localhost:5001
```

O front fala via proxy do Vite (`/api/...` → `http://localhost:5001/...`), igual ao exemplo.
