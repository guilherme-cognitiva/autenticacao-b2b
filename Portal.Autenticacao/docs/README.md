# Documentação — Portal.Autenticacao (`usuarios-service`)

Microsserviço de autenticação do Portal B2B. Responsável pelo cadastro de empresas, gerenciamento de usuários e emissão de tokens JWT consumidos pelos demais microsserviços.

## Índice

| Documento | Conteúdo |
|---|---|
| [`API.md`](./API.md) | Referência completa dos endpoints — requests, responses, códigos de status, exemplos com `curl` |
| [`AUTENTICACAO.md`](./AUTENTICACAO.md) | Fluxo de autenticação, formato do JWT, claims, integração com outros microsserviços |
| [`ARQUITETURA.md`](./ARQUITETURA.md) | Estrutura do projeto, padrões adotados (Repository/Service/Controller), banco de dados, stack |
| [`DEPLOY.md`](./DEPLOY.md) | Como rodar localmente, variáveis de ambiente, instruções para a equipe de infra |

## Resumo executivo

| | |
|---|---|
| **Nome** | Portal.Autenticacao (na arquitetura: `usuarios-service`) |
| **Porta** | `5001` |
| **Stack back** | .NET 10 · Dapper · Npgsql · BCrypt · JWT (HS256) |
| **Stack front** | React 18 · Vite · TypeScript · Tailwind · shadcn/ui · React Router |
| **Banco** | PostgreSQL (compartilhado), schema `portal_b2b` |
| **Tabelas usadas** | `usuario`, `empresa`, `empresa_perfil`, `endereco`, `perfil` |
| **Cria/altera tabelas?** | Não. Apenas DML (SELECT/INSERT/UPDATE/DELETE). |
| **Usuário do banco** | `svc_portal_b2b` (DML only — exigência do trabalho) |

## Endpoints (resumo rápido)

| Método | Rota | Auth? | Descrição |
|---|---|---|---|
| `POST` | `/auth/registro` | público | Cria empresa + endereço + usuário admin (transação atômica) |
| `POST` | `/auth/login` | público | Email + senha → emite JWT |
| `GET` | `/auth/perfis` | público | Lista perfis disponíveis (`FORNECEDOR`, `COMPRADOR`, `TRANSPORTADORA`) |
| `GET` | `/auth/me` | **Bearer** | Dados do usuário autenticado |
| `GET` | `/health` | público | Health check do Postgres |

Detalhes completos em [`API.md`](./API.md).
