FROM oven/bun:1.4.2 AS dependencies

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install


# Compilação do backend
FROM dependencies AS build

WORKDIR /app

COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json ./

ENV NODE_ENV=production

RUN bun build \
  --compile \
  --minify-whitespace \
  --minify-syntax \
  --outfile server \
  src/index.ts


# Atualização do banco e execução da seed
FROM dependencies AS migrate

WORKDIR /app

COPY ./drizzle ./drizzle
COPY drizzle.config.ts tsconfig.json ./

ENV NODE_ENV=production

CMD ["sh", "-c", "bunx --bun drizzle-kit push && bun run db:seed"]


# Imagem final da aplicação
FROM gcr.io/distroless/base AS runtime

WORKDIR /app

COPY --from=build /app/server ./server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE $PORT
