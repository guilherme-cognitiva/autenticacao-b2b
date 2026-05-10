# API — Referência

Base URL local: `http://localhost:5001`
Base URL via API Gateway (produção): `http://34.8.17.245/usuarios` *(roteamento conforme config do gateway)*

Todas as respostas seguem o envelope padrão `ApiResponse<T>`:

```json
{
  "statusHttp": 200,
  "mensagem": "Operacao realizada com sucesso.",
  "resultado": { /* payload tipado */ },
  "erros": []
}
```

Em erros, `resultado` é `null` e `erros[]` contém uma ou mais mensagens.

---

## 1. `POST /auth/registro`

Cria, em **uma única transação ACID**: `empresa` → vínculos em `empresa_perfil` → `endereco` → `usuario` admin. Se qualquer etapa falhar, faz rollback completo.

### Request

```http
POST /auth/registro
Content-Type: application/json
```

```json
{
  "empresa": {
    "razaoSocial": "Empresa X LTDA",
    "nomeFantasia": "Empresa X",
    "cnpj": "12345678000190",
    "email": "contato@empresax.com.br",
    "telefone": "6233334444",
    "perfis": ["FORNECEDOR", "TRANSPORTADORA"]
  },
  "endereco": {
    "cidade": "Goiânia",
    "estado": "GO",
    "cep": "74000000"
  },
  "usuario": {
    "nome": "Guilherme Miranda",
    "email": "guilherme@empresax.com.br",
    "senha": "minhasenhasegura",
    "telefone": "62999998888"
  }
}
```

### Validações

| Campo | Regra |
|---|---|
| `empresa.razaoSocial` | obrigatório, ≤ 255 chars |
| `empresa.nomeFantasia` | opcional, ≤ 255 chars |
| `empresa.cnpj` | obrigatório, exatamente 14 dígitos (apenas números — máscaras são removidas) |
| `empresa.email` | obrigatório, formato de email, ≤ 150 chars |
| `empresa.telefone` | opcional, ≤ 20 chars |
| `empresa.perfis` | mínimo 1 item; valores válidos: `FORNECEDOR`, `COMPRADOR`, `TRANSPORTADORA` |
| `endereco.cidade` | obrigatório, ≤ 100 chars |
| `endereco.estado` | obrigatório, 2 letras (UF) |
| `endereco.cep` | obrigatório, exatamente 8 dígitos |
| `usuario.nome` | obrigatório, ≤ 150 chars |
| `usuario.email` | obrigatório, formato de email, ≤ 150 chars |
| `usuario.senha` | obrigatório, mínimo 8 chars, máximo 100 chars |
| `usuario.telefone` | opcional, ≤ 20 chars |

### Response — sucesso (`HTTP 201 Created`)

```json
{
  "statusHttp": 201,
  "mensagem": "Cadastro realizado com sucesso.",
  "resultado": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiraEm": "2026-05-10T18:30:00+00:00",
    "usuario": {
      "id": "8f3b2e1a-9c4d-4f5e-b6a7-1d2e3f4a5b6c",
      "empresaId": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
      "nome": "Guilherme Miranda",
      "email": "guilherme@empresax.com.br",
      "telefone": "62999998888",
      "status": "ATIVO",
      "dataCadastro": "2026-05-09T22:15:30+00:00"
    },
    "empresa": {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
      "razaoSocial": "Empresa X LTDA",
      "nomeFantasia": "Empresa X",
      "cnpj": "12345678000190",
      "email": "contato@empresax.com.br",
      "telefone": "6233334444",
      "status": "ATIVO",
      "perfis": ["FORNECEDOR", "TRANSPORTADORA"]
    }
  },
  "erros": []
}
```

> Observação: o registro **já emite o JWT**. O front-end pode logar o usuário automaticamente, sem chamar `/auth/login` em seguida.

### Response — erros possíveis

| HTTP | Mensagem (exemplo) | Quando |
|---|---|---|
| `400` | `"CNPJ deve conter 14 digitos."` | Qualquer falha de validação |
| `400` | `"Selecione ao menos um perfil para a empresa."` | Lista de perfis vazia |
| `400` | `"Um ou mais perfis informados nao existem. Use FORNECEDOR, COMPRADOR ou TRANSPORTADORA."` | Perfil inválido |
| `409` | `"Ja existe uma empresa com esse CNPJ ou email."` | CNPJ ou email da empresa duplicado |
| `409` | `"Ja existe um usuario com esse email."` | Email do usuário duplicado |
| `500` | `"Erro interno ao processar a requisicao."` | Falha não tratada (rollback automático) |

### Exemplo `curl`

```bash
curl -X POST http://localhost:5001/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "empresa": {
      "razaoSocial": "Empresa X LTDA",
      "cnpj": "12345678000190",
      "email": "contato@empresax.com.br",
      "perfis": ["FORNECEDOR"]
    },
    "endereco": {
      "cidade": "Goiânia",
      "estado": "GO",
      "cep": "74000000"
    },
    "usuario": {
      "nome": "Guilherme Miranda",
      "email": "guilherme@empresax.com.br",
      "senha": "minhasenhasegura"
    }
  }'
```

---

## 2. `POST /auth/login`

Autentica por email + senha, retorna JWT.

### Request

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "guilherme@empresax.com.br",
  "senha": "minhasenhasegura"
}
```

### Response — sucesso (`HTTP 200 OK`)

Mesma estrutura do registro:

```json
{
  "statusHttp": 200,
  "mensagem": "Login realizado com sucesso.",
  "resultado": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiraEm": "2026-05-10T18:30:00+00:00",
    "usuario": { /* ... */ },
    "empresa": { /* ... */ }
  },
  "erros": []
}
```

### Response — erros

| HTTP | Mensagem | Quando |
|---|---|---|
| `400` | `"Email invalido."` | Email ausente ou mal formatado |
| `400` | `"Senha e obrigatoria."` | Senha vazia |
| `401` | `"Email ou senha invalidos."` | Combinação não confere |
| `403` | `"Usuario inativo. Contate o administrador da sua empresa."` | `usuario.status != 'ATIVO'` |
| `404` | `"Empresa do usuario nao encontrada."` | Inconsistência de dados |

### Exemplo `curl`

```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guilherme@empresax.com.br","senha":"minhasenhasegura"}'
```

---

## 3. `GET /auth/perfis`

Lista os perfis cadastrados na tabela `portal_b2b.perfil`. Útil para popular selects/checkboxes na tela de cadastro.

### Request

```http
GET /auth/perfis
```

### Response (`HTTP 200 OK`)

```json
{
  "statusHttp": 200,
  "mensagem": "Operacao realizada com sucesso.",
  "resultado": [
    { "id": "77f0b7ef-6be7-4e39-8e80-a2764e0d4faa", "nome": "FORNECEDOR" },
    { "id": "280dcccf-0198-4ce2-b05e-53b38ecd2219", "nome": "COMPRADOR" },
    { "id": "24863398-745a-4ea8-aa69-de58c29094b2", "nome": "TRANSPORTADORA" }
  ],
  "erros": []
}
```

### Exemplo `curl`

```bash
curl http://localhost:5001/auth/perfis
```

---

## 4. `GET /auth/me`

Retorna os dados do usuário **autenticado pelo JWT**. Requer header `Authorization`.

### Request

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Response — sucesso (`HTTP 200 OK`)

```json
{
  "statusHttp": 200,
  "mensagem": "Operacao realizada com sucesso.",
  "resultado": {
    "id": "8f3b2e1a-9c4d-4f5e-b6a7-1d2e3f4a5b6c",
    "empresaId": "1a2b3c4d-5e6f-7a8b-9c0d-e1f2a3b4c5d6",
    "nome": "Guilherme Miranda",
    "email": "guilherme@empresax.com.br",
    "telefone": "62999998888",
    "status": "ATIVO",
    "dataCadastro": "2026-05-09T22:15:30+00:00"
  },
  "erros": []
}
```

### Response — erros

| HTTP | Quando |
|---|---|
| `401` | Token ausente, inválido ou expirado |
| `404` | Token válido mas usuário não existe mais no banco |

### Exemplo `curl`

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl http://localhost:5001/auth/me -H "Authorization: Bearer $TOKEN"
```

---

## 5. `GET /health`

Health check do serviço — testa conexão com Postgres. Pensado para liveness/readiness probes (Kubernetes/Load Balancer).

### Request

```http
GET /health
```

### Response — saudável (`HTTP 200 OK`)

```
Healthy
```

### Response — não saudável (`HTTP 503 Service Unavailable`)

```
Unhealthy
```

---

## Códigos de status HTTP por categoria

| Código | Significado neste serviço |
|---|---|
| `200` | OK — login, listagem ou consulta |
| `201` | Created — registro de empresa/usuário |
| `400` | Bad Request — falha de validação de campo |
| `401` | Unauthorized — credenciais inválidas ou JWT inválido/ausente |
| `403` | Forbidden — usuário existe mas está inativo |
| `404` | Not Found — recurso referenciado não existe |
| `409` | Conflict — violação de unique constraint (email/CNPJ duplicado) |
| `500` | Internal Server Error — erro não tratado (logado com Serilog) |
| `503` | Service Unavailable — health check falhou |

## Documentação interativa (Swagger)

Com o serviço rodando, acesse:

- **Swagger UI**: http://localhost:5001/swagger
- **OpenAPI JSON**: http://localhost:5001/swagger/v1/swagger.json

Permite testar todos os endpoints diretamente do navegador, incluindo autenticação Bearer.
