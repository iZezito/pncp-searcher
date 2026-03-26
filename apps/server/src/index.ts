import { Elysia, t } from "elysia";
import { userController } from "@/modules/user";
import cors from "@elysiajs/cors";
import { authController } from "@/modules/auth";
import { CustomError } from "./error";
import { SQL } from "bun";
import { openapi } from "@elysiajs/openapi";
import { DrizzleQueryError } from "drizzle-orm";
import { engine } from "./lib/socket-io";
import { queue } from "./lib/queue";
import "./worker";
import { itensController } from "./modules/itens_planilha";
import { planilhasController } from "./modules/planilha";

const app = new Elysia()
  .use(
    cors({
      origin: Bun.env.CLIENT_URL! || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
  .onError(({ error }) => {
    if (error instanceof DrizzleQueryError) {
      if (error.cause instanceof SQL.PostgresError) {
        return {
          message: error.cause.message || error.message,
          code: 400,
          timestamp: new Date().toISOString(),
        };
      }
    }

    if (error instanceof CustomError) {
      return {
        message: error.message,
        code: error.status,
        timestamp: new Date().toISOString(),
      };
    }
  })
  .get("/healthcheck", ({ status }) => {
    return "ok";
  })
  .post(
    "/deep-search",
    async ({ status, body }) => {
      console.log("recebido");
      const job = await queue.add("deep-search", {
        buscaId: "teste",
        busca: body.busca,
        palavrasChave: body.palavrasChave,
        userId: "testeId",
      });
      return job.id;
    },
    {
      body: t.Object({
        busca: t.String(),
        palavrasChave: t.Array(t.String()),
        planilhaId: t.Optional(t.String()),
      }),
    },
  )
  .use(openapi())
  .use(userController)
  .use(authController)
  .use(planilhasController)
  .use(itensController);

const { websocket } = engine.handler();

export default {
  port: process.env.PORT ?? 3000,
  idleTimeout: 120,

  fetch(req: Request, server: any) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/socket.io/")) {
      return engine.handleRequest(req, server);
    }

    return app.fetch(req, server);
  },
  websocket,
};

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
