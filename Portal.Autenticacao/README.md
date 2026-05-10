# Portal.Autenticacao (`usuarios-service`)

Microsserviço de autenticação do Portal B2B. Roda na porta **5001** e expõe endpoints sob `/api/usuarios/*` no Load Balancer.

- **Back-end**: .NET 10 + Dapper + Npgsql + JWT (BCrypt para senha)
- **Front-end**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Banco**: PostgreSQL Cloud SQL (`136.114.235.212:5432`), schema `portal_b2b`

Usa as tabelas existentes: `usuario`, `empresa`, `empresa_perfil`, `endereco`, `perfil`. **Não cria nem altera nenhuma tabela.**

📖 **Documentação completa em [`docs/`](./docs/)** — endpoints, JWT, arquitetura, deploy.

---

## Endpoints (resumo)

| Método | Rota local | Rota via Load Balancer |
|---|---|---|
| `POST` | `/auth/login` | `http://34.8.17.245/api/usuarios/auth/login` |
| `POST` | `/auth/registro` | `http://34.8.17.245/api/usuarios/auth/registro` |
| `GET` | `/auth/perfis` | `http://34.8.17.245/api/usuarios/auth/perfis` |
| `GET` | `/auth/me` (Bearer) | `http://34.8.17.245/api/usuarios/auth/me` |
| `GET` | `/health` | `http://34.8.17.245/api/usuarios/health` |

Detalhes completos em [`docs/API.md`](./docs/API.md).

---

## Como rodar localmente

### Opção A — Via Docker Compose (mais próximo do deploy real)

```bash
# 1. Criar a rede docker (uma vez)
docker network create portal-b2b-network

# 2. Configurar .env
cp .env.example .env
# Edite o .env: ajuste DATABASE_URL e gere um JWT_SECRET (openssl rand -base64 64)

# 3. Subir
docker compose up -d --build

# 4. Verificar
curl http://localhost:5001/health        # → Healthy
curl -I http://localhost:8082/           # → HTTP 200
```

Front em http://localhost:8082 · Back em http://localhost:5001 · Swagger em http://localhost:5001/swagger.

### Opção B — Sem Docker (desenvolvimento)

#### Back-end (.NET 10)
```bash
cd back-end/Portal.Autenticacao.Api
cp .env.example .env       # ajuste DATABASE_URL e JWT_SECRET
dotnet restore
dotnet run
```

API em `http://localhost:5001` · Swagger em `http://localhost:5001/swagger`.

#### Front-end
```bash
cd front-end
cp .env.example .env
npm install
npm run dev
```

Front em `http://localhost:8082`. Rotas:
- `/login` — tela de login
- `/registro` — cadastro de empresa em 3 abas (Empresa → Endereço → Usuário)
- `/dashboard` — página principal com cards dos módulos do Portal B2B

---

## Variáveis de ambiente

Veja [`.env.example`](./.env.example) na raiz do projeto.

**Obrigatórias:**
- `DATABASE_URL` — string de conexão Postgres
- `JWT_SECRET` — chave HMAC (mínimo 32 chars). Aplicação falha rápido se ausente
- `CORS_ALLOWED_ORIGINS` — origens permitidas separadas por vírgula

**Compartilhadas com outros microsserviços:** `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` precisam ser idênticas em todos os serviços para que validem tokens emitidos por aqui.

---

## Deploy

Equipe de infra faz deploy via:

```bash
bash scripts/deploy-service-redundant.sh \
     usuarios-service \
     https://github.com/guilherme-cognitiva/autenticacao-b2b.git
```

Detalhes em [`docs/DEPLOY.md`](./docs/DEPLOY.md).
