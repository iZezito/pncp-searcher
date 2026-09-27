# PNCP Searcher

O Deep Search é uma plataforma para apoiar a Prefeitura Municipal de Ipanguaçu na estimativa de preços para processos licitatórios. A aplicação reduz o trabalho manual ao pesquisar itens no Portal Nacional de Contratações Públicas (PNCP), reunir referências de preços e organizar os resultados em planilhas reutilizáveis.

## Problema e objetivo

A pesquisa de preços para licitações era feita manualmente e consumia muito tempo. O projeto foi criado para tornar esse processo mais rápido, rastreável e centralizado, permitindo que a equipe:

- crie planilhas com os itens da contratação;
- pesquise um item no PNCP usando uma descrição e palavras-chave;
- acompanhe os resultados da busca em tempo real;
- pause, retome ou cancele uma busca em andamento;
- salve resultados e fontes vinculados aos itens da planilha;
- consulte, edite, pesquise e exporte planilhas e resultados salvos.

O sistema é uma ferramenta de apoio à estimativa de preços. A análise e a validação dos valores continuam sendo responsabilidade da equipe responsável pela contratação.

## Como funciona

1. O usuário cria uma conta ou entra na plataforma.
2. Uma planilha é criada para representar a pesquisa de um processo.
3. Os itens são cadastrados com descrição, quantidade, unidade e, opcionalmente, valor.
4. O usuário inicia uma busca informando o item e palavras-chave.
5. O backend executa a busca de forma assíncrona, usando uma fila de jobs, e consulta dados públicos do PNCP.
6. Os resultados são enviados ao frontend em tempo real por Socket.IO.
7. O usuário pode salvar referências, links e valores para consultar posteriormente.

## Funcionalidades

- Autenticação por e-mail, confirmação de e-mail e recuperação de senha.
- Login opcional com Google OAuth.
- Gerenciamento de perfil e usuários.
- Criação, edição, exclusão e pesquisa de planilhas.
- Cadastro e edição de itens de uma planilha.
- Busca profunda com execução em segundo plano.
- Atualização de resultados em tempo real.
- Controle de execução com pausar, retomar, parar e limpar resultados.
- Histórico de resultados salvos com paginação e pesquisa.
- Exportação de planilhas para Excel.
- Interface responsiva com suporte a tema claro e escuro.

## Arquitetura

O repositório é um monorepo gerenciado pelo Turborepo e Bun:

- `apps/web`: frontend em React, TypeScript, Vite, Tailwind CSS e React Router.
- `apps/server`: API em Bun, Elysia e TypeScript, com módulos de autenticação, usuários, planilhas, itens e busca.
- `apps/server/drizzle`: schema e migrations do PostgreSQL.
- `packages`: configurações compartilhadas do TypeScript e ESLint.

Serviços utilizados pela aplicação:

- PostgreSQL para usuários, planilhas, itens e resultados.
- Redis para filas, cache e controle dos jobs de busca.
- Socket.IO para transmitir o progresso e os resultados ao navegador.
- PNCP como fonte pública consultada pela busca.

## Pré-requisitos

- [Bun](https://bun.sh/) `1.3.7` ou compatível.
- PostgreSQL `16`.
- Redis `8`.
- Credenciais de e-mail para confirmação de conta e recuperação de senha.
- Credenciais do Google OAuth caso o login com Google seja utilizado.

## Configuração local

Instale as dependências na raiz do projeto:

```bash
bun install
```

Crie `apps/server/.env` com as variáveis necessárias:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pncp
REDIS_URL=redis://localhost:6379
JWT_SECRET=uma-chave-secreta
CLIENT_URL=http://localhost:5173
PORT=3000
NODE_ENV=development

MAIL_HOST=smtp.example.com
MAIL_USER=usuario
MAIL_PASS=senha
MAIL_FROM=no-reply@example.com

GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

No frontend, defina `apps/web/.env`:

```env
VITE_BASE_URL=http://localhost:3000
```

Aplique as migrations do banco e inicie os serviços:

```bash
bun run --cwd apps/server db:migrate
bun run dev
```

O frontend fica disponível em `http://localhost:5173`. A API usa `http://localhost:3000` por padrão.

## Docker Compose

O compose da raiz inicia o frontend, a API, o PostgreSQL e o Redis. Antes de iniciar, configure `apps/server/.env` e execute:

```bash
docker compose up --build
```

Depois, acesse `http://localhost`. Os dados do PostgreSQL e do Redis ficam nos volumes `postgres_data` e `redis_data`.

## Comandos úteis

```bash
bun run dev          # inicia frontend e backend
bun run build        # gera os builds
bun run lint         # executa o ESLint
bun run check-types  # verifica os tipos TypeScript
bun run format       # formata TypeScript e Markdown
```

Comandos específicos do backend:

```bash
bun run --cwd apps/server db:generate
bun run --cwd apps/server db:migrate
bun run --cwd apps/server db:studio
bun run --cwd apps/server email
```

## Estrutura resumida

```text
apps/
├── server/
│   ├── src/modules/       # autenticação, usuários, planilhas e buscas
│   ├── src/lib/            # banco, Redis, filas, e-mail e Socket.IO
│   └── drizzle/migrations/ # migrations do PostgreSQL
└── web/
    └── src/
        ├── components/    # componentes reutilizáveis
        ├── pages/         # telas da aplicação
        ├── services/      # comunicação com a API
        └── types/         # tipos compartilhados do frontend
```
