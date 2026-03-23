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
      return await ItensPlanilhaService.update(body, params.itemPlanilhaId);
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
  );
