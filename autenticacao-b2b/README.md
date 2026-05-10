# autenticacao-b2b — `usuarios-service`

Repositório do microsserviço de autenticação do Portal B2B.

| | |
|---|---|
| **Serviço** | `usuarios-service` |
| **Porta** | `5001` |
| **Rota no Gateway** | `/api/usuarios/*` |
| **Health** | `/api/usuarios/health` |
| **Banco** | Cloud SQL `136.114.235.212:5432` (schema `portal_b2b`) |

## Estrutura do repositório

```
autenticacao-b2b/                ← raiz do repo (você está aqui)
├── docker-compose.yml           # build dos 2 containers
├── .env.example                 # template de variáveis
├── Dockerfile                   # marcador (build real está em compose)
├── .gitignore
└── Portal.Autenticacao/         # código-fonte
    ├── back-end/
    │   └── Portal.Autenticacao.Api/
    │       ├── Dockerfile       # ← build do usuarios-service
    │       └── ...código .NET
    ├── front-end/
    │   ├── Dockerfile           # ← build do portal-front
    │   ├── nginx.conf
    │   └── ...código React
    └── docs/
        ├── API.md
        ├── AUTENTICACAO.md
        ├── ARQUITETURA.md
        └── DEPLOY.md
```

## Deploy (infra)

```bash
bash scripts/deploy-service-redundant.sh \
     usuarios-service \
     https://github.com/guilherme-cognitiva/autenticacao-b2b.git
```

O script clona o repo em `/opt/portal-b2b/services/usuarios-service`, lê `docker-compose.yml` e `.env` da raiz e sobe os 2 containers na rede `portal-b2b-network`.

## Rodar localmente

```bash
# 1. Cria a rede docker (uma vez só)
docker network create portal-b2b-network

# 2. Configura .env
cp .env.example .env
# Edite o .env: ajuste DATABASE_URL e gere um JWT_SECRET (openssl rand -base64 64)

# 3. Sobe
docker compose up -d --build

# 4. Verifica
curl http://localhost:5001/health        # → Healthy
curl -I http://localhost:8082/           # → HTTP 200
```

Front em http://localhost:8082 · Back em http://localhost:5001 · Swagger em http://localhost:5001/swagger.

## Documentação completa

📖 [`Portal.Autenticacao/docs/`](./Portal.Autenticacao/docs/) — endpoints, JWT, arquitetura, deploy.

## Restrições de segurança

- ✅ Microsserviço usa `svc_portal_b2b` (DML only)
- ✅ Sem `localhost:5432` ou `postgres:5432` em fallback
- ✅ Sem PostgreSQL no `docker-compose.yml`
- ✅ `.env` no `.gitignore` — nunca vai pro GitHub
- ✅ `JWT_SECRET` validado na inicialização
- ✅ Front usa rota relativa `/api/usuarios` (nada hardcoded de IP de VM)
