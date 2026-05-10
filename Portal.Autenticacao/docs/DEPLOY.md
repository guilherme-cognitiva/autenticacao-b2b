# Deploy

Este serviço (`usuarios-service`) faz parte da arquitetura do Portal B2B e é deployado pela equipe de infra através do `deploy-service-redundant.sh`.

## 1. Topologia esperada na infra

```
                  Internet
                      │
                      ▼
            ┌──────────────────┐
            │  Load Balancer   │  http://34.8.17.245
            │  (porta 80)      │
            └────────┬─────────┘
                     │
          ┌──────────┴───────────┐
          │                      │
          ▼                      ▼
    /api/usuarios/*           /  (raiz)
          │                      │
          ▼                      ▼
   usuarios-service         portal-front
   (container :5001)        (container :80)
          │                      │
          └──────────┬───────────┘
                     │ rede docker: portal-b2b-network
                     ▼
            Cloud SQL (PostgreSQL)
            136.114.235.212:5432
            schema: portal_b2b
            usuário: svc_portal_b2b
```

## 2. Containers

| Container | Origem | Porta interna | Porta externa | Rede |
|---|---|---|---|---|
| `usuarios-service` | `back-end/Portal.Autenticacao.Api/Dockerfile` | 5001 | 5001 | `portal-b2b-network` |
| `portal-front` | `front-end/Dockerfile` | 80 | 8082 | `portal-b2b-network` |

## 3. Rotas externas (via Load Balancer)

```text
GET  http://34.8.17.245/api/usuarios/health
POST http://34.8.17.245/api/usuarios/auth/login
POST http://34.8.17.245/api/usuarios/auth/registro
GET  http://34.8.17.245/api/usuarios/auth/perfis
GET  http://34.8.17.245/api/usuarios/auth/me
```

## 4. Variáveis de ambiente (.env na raiz)

Veja [`.env.example`](../.env.example) para o template completo. Antes do deploy, gere uma chave JWT real:

```bash
openssl rand -base64 64 | tr -d '\n=' | cut -c1-72
```

E coloque em `JWT_SECRET`. **Nunca commit a chave real**.

### Obrigatórias

| Variável | Função |
|---|---|
| `DATABASE_URL` | Conexão Postgres no formato `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Chave HMAC pra assinar JWTs (mín. 32 chars) |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas, separadas por vírgula |

### Compartilhadas com outros microsserviços

`JWT_SECRET`, `JWT_ISSUER` (`portal-autenticacao`) e `JWT_AUDIENCE` (`portal-b2b`) **devem ser idênticas** em todos os microsserviços do Portal B2B. Caso contrário eles não conseguirão validar tokens emitidos por este serviço.

## 5. Deploy via script da infra

```bash
bash scripts/deploy-service-redundant.sh \
     usuarios-service \
     https://github.com/guilherme-cognitiva/autenticacao-b2b.git
```

O script:
1. Faz `git clone` (ou pull) do repo
2. Lê o `docker-compose.yml` da raiz
3. Builda as imagens dos dois containers
4. Sobe na `portal-b2b-network` (rede externa que já deve existir)

## 6. Testes pós-deploy

### Health check local na VM
```bash
curl http://localhost:5001/health
# → "Healthy"
```

### Health via Load Balancer
```bash
curl http://34.8.17.245/api/usuarios/health
# → "Healthy"
```

### Front acessível
```bash
curl -I http://34.8.17.245/
# → HTTP/1.1 200 OK
```

### Login funcional (smoke test)
```bash
# Primeiro registra uma empresa de teste
curl -X POST http://34.8.17.245/api/usuarios/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": {
      "razaoSocial": "Empresa Teste Deploy",
      "cnpj": "12345678000190",
      "email": "deploy@teste.com",
      "perfis": ["FORNECEDOR"]
    },
    "endereco": {
      "cidade": "Goiânia",
      "estado": "GO",
      "cep": "74000000"
    },
    "usuario": {
      "nome": "Admin Deploy",
      "email": "admin@teste.com",
      "senha": "senha12345"
    }
  }'

# Depois loga
curl -X POST http://34.8.17.245/api/usuarios/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com","senha":"senha12345"}'
```

A resposta deve incluir um JWT válido e os dados da empresa.

## 7. Rede Docker externa

O `docker-compose.yml` espera uma rede chamada `portal-b2b-network` já criada. Se ainda não existir:

```bash
docker network create portal-b2b-network
```

Outros serviços (`produtos-service`, `pedidos-service`, etc.) devem entrar nessa mesma rede para conseguirem comunicar entre si por nome de container (ex: `http://usuarios-service:5001`).

## 8. Subir tudo localmente (caso queira testar antes do deploy real)

```bash
# 1. Cria a rede (uma vez)
docker network create portal-b2b-network

# 2. Cria o .env a partir do exemplo
cp .env.example .env
# Edite o .env: ajuste DATABASE_URL e gere um JWT_SECRET real

# 3. Sobe
docker compose up -d --build

# 4. Verifica
docker compose ps
docker compose logs -f usuarios-service
curl http://localhost:5001/health
curl -I http://localhost:8082/
```

## 9. Ordem de deploy recomendada (Portal B2B inteiro)

Para uma stack zerada:

```text
1. portal-b2b-network          (docker network create)
2. Cloud SQL                   (já existe — 136.114.235.212)
3. usuarios-service (5001)     ← este projeto
4. produtos-service (5002)
5. fornecimentos-service (5003)
6. demanda-service (5004)
7. mercado-service (5005)
8. negociacao-service (5006)
9. pedidos-service (5007)
10. logistica-service (5008)
11. transportadoras-service (5009)
12. portal-front (8082)        ← este projeto
13. Load Balancer              (configurar rotas /api/usuarios/, /api/produtos/, etc.)
```

## 10. Restrições de segurança seguidas

- ✅ Microsserviço usa `svc_portal_b2b` (DML only) — **nunca** `db_portal_b2b` ou admin
- ✅ Sem `localhost:5432` ou `postgres:5432` em fallback
- ✅ Sem PostgreSQL no `docker-compose.yml`
- ✅ `.env` listado no `.gitignore` — não vai pro GitHub
- ✅ `JWT_SECRET` validado na inicialização (falha rápido se não configurado)
- ✅ Front usa rotas relativas (`/api/usuarios`) — independente do IP da VM
- ✅ CORS restrito a origens explícitas
