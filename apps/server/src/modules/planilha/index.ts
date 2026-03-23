import { Elysia, t } from "elysia";
import { PlanilhaService } from "./service";
import { planilhaInsertSchema, planilhaSelectSchema } from "./model";
// import { authGuard } from "@/plugin/middleware";
import ExcelJS from "exceljs";
import { ItensPlanilhaService } from "../itens_planilha/service";
import { ItensPlanilhaInsert } from "../itens_planilha/model";

export const planilhasController = new Elysia({
  prefix: "/planilhas",
})
  // .use(authGuard)
  .get(
    "/",
    async () => {
      return await PlanilhaService.findAll();
    },
    {
      response: t.Array(planilhaSelectSchema),
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const workbook = new ExcelJS.Workbook();
      const buffer = await body.planilha.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const headers = worksheet.getRow(1).values as string[];
      console.log(headers);
      const { planilha, ...rest } = body;
      const planilhaId = await PlanilhaService.create({
        ...rest,
        userId: "tf7elb2ad0fcxiqhrrnnmmsj",
      });

      const HEADERS = ["Item", "Unidade", "Quantidade", "Descrição"] as const;

      const itens: ItensPlanilhaInsert[] = (
        worksheet.getRows(2, worksheet.rowCount - 1) ?? []
      )
        .map((row) => {
          const values = row.values as unknown[];
          return HEADERS.reduce(
            (acc, header) => {
              const colIndex = headers.indexOf(header);
              if (colIndex !== -1) {
                acc[header] = values[colIndex];
              }
              return acc;
            },
            {} as Record<(typeof HEADERS)[number], unknown>,
          );
        })
        .filter((item) =>
          Object.values(item).some(
            (value) => value !== undefined && value !== null && value !== "",
          ),
        )
        .map((item) => ({
          unidade: String(item["Unidade"] ?? ""),
          quantidade: Number(item["Quantidade"] ?? 0),
          descricao: String(item["Descrição"] ?? ""),
          planilhaId: planilhaId[0].id,
          numero: Number(item["Item"] ?? "0"),
          valor: 0,
          fonte: "",
        }));

      await ItensPlanilhaService.create(itens);
    },
    {
      body: t.Object({
        name: t.String(),
        planilha: t.File({
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      }),
    },
  )

  .put(
    "/:id",
    async ({ body, params }) => {
      return await PlanilhaService.update(params.id, body);
    },
    {
      body: planilhaInsertSchema,
      response: planilhaSelectSchema,
    },
  )
  .delete(
    "/:id",
    async ({ params }) => {
      return await PlanilhaService.delete(params.id);
    },
    {
      response: planilhaSelectSchema,
    },
  );
