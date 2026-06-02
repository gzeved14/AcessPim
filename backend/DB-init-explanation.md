# Por que mover os scripts para `backend/src/db` e como recriar o banco

Resumo rápido
- O PostgreSQL no contêiner executa automaticamente os arquivos SQL que estiverem em `/docker-entrypoint-initdb.d` **somente** na *primeira inicialização* do volume de dados. Se o volume já existe, esses scripts não serão reexecutados.
- O Docker precisa montar a pasta correta do host onde seus scripts reais estão. No seu caso os SQLs verdadeiros estão em `backend/src/db`, não em `backend/db`.

Por que a mudança foi necessária
- Antes o `docker-compose.yml` apontava para `./db`, mas os scripts estavam em `./src/db` — então o container não via os SQLs reais e nenhum esquema era criado.
- Montar a pasta errada ⇒ init scripts não executados ⇒ banco vazio.

O que eu mudei
- Atualizei `backend/docker-compose.yml` para montar `./src/db` em `/docker-entrypoint-initdb.d` do container.
- Copiei/garanti os arquivos SQL (schema, seeds, migrations) em `backend/src/db`.

Comandos essenciais (PowerShell)
> Observação: em PowerShell use `$env:VAR` para variáveis de ambiente do shell.

1) Parar containers e remover volume (ATENÇÃO: remove dados existentes):

```powershell
docker compose -f backend/docker-compose.yml down
docker volume rm backend_db_data
```

2) Subir novamente (scripts em `/docker-entrypoint-initdb.d` serão executados na primeira inicialização):

```powershell
docker compose -f backend/docker-compose.yml up -d
```

3) Acompanhar logs para confirmar execução dos scripts:

```powershell
docker compose -f backend/docker-compose.yml logs -f db
```

4) Ver tabelas com `psql` (use aspas simples para `\dt` no PowerShell):

```powershell
docker exec -it accesspim_db psql -U postgres -d accesspim -c '\dt'
# ou usando variáveis do PowerShell
docker exec -it accesspim_db psql -U $env:DB_USER -d $env:DB_NAME -c '\dt'
```

Dicas sobre variáveis e PowerShell
- Em PowerShell `'$VAR'` não expande; use `$env:DB_USER` para usar variáveis de ambiente.
- Evite usar `$DB_USER` diretamente no PowerShell — isso funciona em shells Unix (bash), não no PowerShell.

Por que os scripts não rodaram antes
- Se o volume `backend_db_data` já existia, o entrypoint do Postgres ignora `/docker-entrypoint-initdb.d`. É por isso que precisar remover o volume para forçar a execução.

Como escrever scripts idempotentes (melhor prática)
- Garanta que seus scripts possam rodar múltiplas vezes sem causar erro:
  - `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
  - `CREATE TABLE IF NOT EXISTS ...` ou usar `CREATE TABLE ... IF NOT EXISTS` conforme suporte
  - Usar `INSERT ... ON CONFLICT DO NOTHING` para seeds
  - Envolver migrações sensíveis com checagens `IF NOT EXISTS` ou `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`

Como funcionar se você quiser containerizar também o backend
- Mude `DB_HOST` para `db` no `.env` (ou no service do backend no compose) para que o backend se conecte ao serviço `db` via rede interna do compose.
- Exemplo (compose multi-service):

```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./src/db:/docker-entrypoint-initdb.d:ro
  backend:
    build: .
    environment:
      DB_HOST: db
    depends_on:
      - db
volumes:
  db_data:
```

Verificação rápida do compose (sem subir containers)

```powershell
docker compose -f backend/docker-compose.yml config
```

Isso mostra como as variáveis são interpoladas e quais mounts serão usados.

Observações finais
- Remover o volume apaga dados reais — faça backup se houver dados importantes.
- Se preferir não remover volumes, você pode aplicar o `schema.sql` manualmente conectando via `psql` e executando `\i /path/to/schema.sql`, mas montar a pasta correta é mais simples para inicialização automática.

Se quiser, posso:
- Gerar um script `backend/db/init-all.sql` que combine `schema` + `seeds` e torne mais simples a reexecução manual;
- Adicionar um serviço `backend` no `docker-compose` para rodar a aplicação junto com o DB;
- Criar um pequeno backup/restore script para o volume antes de removê-lo.

---
Arquivo criado: `backend/DB-init-explanation.md` (no workspace)