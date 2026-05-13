# Stage 1: Build da aplicação
FROM oven/bun AS build

ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

# Stage 2: Servir com Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
