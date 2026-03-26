import { Elysia, t } from "elysia";
import { PlanilhaService } from "./service";
import { planilhaInsertSchema, planilhaSelectSchema } from "./model";
import ExcelJS from "exceljs";
import { ItensPlanilhaService } from "../itens_planilha/service";
import { ItensPlanilhaInsert } from "../itens_planilha/model";
import { authGuard } from "@/plugin/middleware";

export const planilhasController = new Elysia({
  prefix: "/planilhas",
})
  .use(authGuard)
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
    async ({ body, user }) => {
      const workbook = new ExcelJS.Workbook();
      const buffer = await body.planilha.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const headers = worksheet.getRow(1).values as string[];
      console.log(headers);
      const { planilha, ...rest } = body;
      const planilhaId = await PlanilhaService.create({
        ...rest,
        userId: user.id,
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
  )
  .get(
    "/:id/download",
    async ({ params, set }) => {
      const planilha = await PlanilhaService.findById(params.id);
      if (!planilha) {
        set.status = 404;
        return { message: "Planilha não encontrada" };
      }

      const items = await ItensPlanilhaService.findByPlanilhaId(params.id);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Planilha");

      worksheet.columns = [
        { header: "Item", key: "numero", width: 10 },
        { header: "Unidade", key: "unidade", width: 15 },
        { header: "Quantidade", key: "quantidade", width: 15 },
        { header: "Descrição", key: "descricao", width: 40 },
        { header: "Valor", key: "valor", width: 15 },
        { header: "Fonte", key: "fonte", width: 40 },
      ];

      for (const item of items) {
        worksheet.addRow({
          numero: item.numero,
          unidade: item.unidade,
          quantidade: item.quantidade,
          descricao: item.descricao,
          valor: item.valor,
          fonte: item.fonte,
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();

      set.headers["Content-Type"] =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      set.headers["Content-Disposition"] =
        `attachment; filename="${planilha.name}.xlsx"`;

      return new Response(buffer as ArrayBuffer);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
