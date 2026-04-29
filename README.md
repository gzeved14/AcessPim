# AccessPIM

Sistema full stack para controle de acesso em áreas industriais.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Estrutura

- back-end: API Express + TypeORM + PostgreSQL
- front-end: Angular standalone

## Instalação

1. Instale dependências no workspace:

```bash
npm install
```

2. Suba o banco de dados:

```bash
docker compose -f back-end/docker-compose.yaml up -d
```

3. Configure variáveis de ambiente do back-end criando `back-end/.env` com base em `back-end/.env.example`.

4. Crie schema e seed:

```bash
npm run db:seed
```

## Execução em desenvolvimento

```bash
npm run dev
```

- Front-end: http://localhost:4200
- Back-end: http://localhost:3000

## Build e testes

```bash
npm run build
npm run test
```

## Validação de requisitos não funcionais

### RNF01 — SLA local (< 2s por endpoint)

Use o comando abaixo para medir o tempo de resposta do dashboard em rede local:

```powershell
$loginBody = @{ email = '...'; password = '...' } | ConvertTo-Json
$login = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method Post -ContentType 'application/json' -Body $loginBody
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
(Measure-Command { Invoke-RestMethod -Uri 'http://localhost:3000/dashboard' -Method Get -Headers $headers | Out-Null }).TotalMilliseconds
```

Critério: resultado menor que 2000 ms.

### RNF03 — Rotas protegidas

- `/auth/login`: pública
- `/auth/refresh`: exige refresh token JWT válido no body
- `/auth/logout`: exige access token JWT válido no header
- Demais módulos (`/dashboard`, `/colaborador`, `/area`, `/registro`, `/usuario`): protegidos por middleware JWT

### RNF05 — Repositório público

Este requisito depende de configuração no GitHub:

1. Criar repositório remoto
2. Publicar este workspace
3. Definir visibilidade como pública
4. Manter este README na raiz

## Observações de negócio implementadas

- US03: saída só é permitida quando existe entrada autorizada anterior em aberto para o mesmo colaborador e área.
- US04: registros negados aparecem com destaque visual em vermelho no histórico.
