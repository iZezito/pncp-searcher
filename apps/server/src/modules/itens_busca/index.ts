import { Elysia, t } from "elysia";
import { ItensBuscaService } from "./service";
import { authGuard } from "@/plugin/middleware";

export const itensBuscaController = new Elysia({
  prefix: "/itens-busca",
})
  .use(authGuard)
  .post(
    "/",
    async ({ body, user }) => {
      const result = await ItensBuscaService.create({
        descricao: body.descricao,
        valor: body.valor,
        unidadeMedida: body.unidadeMedida,
        link: body.link,
        fonte: body.fonte,
        paginaInterna: body.paginaInterna,
        paginaExterna: body.paginaExterna,
        itemId: body.itemId ?? null,
        userId: user.id,
      });
      return result[0];
    },
    {
      body: t.Object({
        descricao: t.String(),
        valor: t.Number(),
        unidadeMedida: t.String(),
        link: t.String(),
        fonte: t.String(),
        paginaInterna: t.Number(),
        paginaExterna: t.Number(),
        itemId: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/",
    async ({ query, user }) => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;

      const [data, total] = await Promise.all([
        ItensBuscaService.findByUserId(user.id, page, pageSize),
        ItensBuscaService.countByUserId(user.id),
      ]);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const item = await ItensBuscaService.findById(params.id);
      if (!item) {
        set.status = 404;
        return { message: "Item de busca não encontrado" };
      }
      return item;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const item = await ItensBuscaService.findById(params.id);
      if (!item) {
        set.status = 404;
        return { message: "Item de busca não encontrado" };
      }
      await ItensBuscaService.delete(params.id);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
