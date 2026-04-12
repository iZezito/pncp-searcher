import { Elysia, t } from "elysia";
import { ItensPlanilhaService } from "./service";
import { itensPlanilhaInsertSchema, itensPlanilhaUpdateSchema } from "./model";

export const itensController = new Elysia({
  prefix: "/itens",
})
  .get(
    "/:planilhaId",
    async ({ params }) => {
      return await ItensPlanilhaService.findByPlanilhaId(params.planilhaId);
    },
    {
      params: t.Object({
        planilhaId: t.String(),
      }),
    },
  )
  .post(
    "/:planilhaId/item",
    async ({ body, params }) => {
      const result = await ItensPlanilhaService.createOne({
        ...body,
        fonte: body.fonte ?? "",
        link: body.link ?? "",
        planilhaId: params.planilhaId,
      });
      return result[0];
    },
    {
      body: t.Object({
        numero: t.Number(),
        descricao: t.String({ minLength: 1 }),
        quantidade: t.Number({ minimum: 0 }),
        unidade: t.String({ minLength: 1 }),
        valor: t.Number({ minimum: 0 }),
        fonte: t.Optional(t.String()),
        link: t.Optional(t.String()),
      }),
      params: t.Object({
        planilhaId: t.String(),
      }),
    },
  )
  .put(
    "/:itemPlanilhaId",
    async ({ body, params }) => {
      await ItensPlanilhaService.update(body, params.itemPlanilhaId);
      return { success: true };
    },
    {
      body: itensPlanilhaUpdateSchema,
      params: t.Object({
        itemPlanilhaId: t.String(),
      }),
    },
  )
  .delete(
    "/:itemPlanilhaId",
    async ({ params }) => {
      return await ItensPlanilhaService.delete(params.itemPlanilhaId);
    },
    {
      params: t.Object({
        itemPlanilhaId: t.String(),
      }),
    },
  )
  .put(
    "/:itemPlanilhaId/vincular",
    async ({ body, params }) => {
      await ItensPlanilhaService.updateValorFonte(
        params.itemPlanilhaId,
        body.valor,
        body.fonte,
        body.link,
      );
      return { success: true };
    },
    {
      body: t.Object({
        valor: t.Number(),
        fonte: t.String(),
        link: t.Optional(t.String()),
      }),
      params: t.Object({
        itemPlanilhaId: t.String(),
      }),
    },
  );
