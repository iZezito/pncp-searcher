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
    "/",
    async ({ body }) => {
      return "";
    },
    {
      body: t.Object({
        planilha: t.File({
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
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
      );
      return { success: true };
    },
    {
      body: t.Object({
        valor: t.Number(),
        fonte: t.String(),
      }),
      params: t.Object({
        itemPlanilhaId: t.String(),
      }),
    },
  );
