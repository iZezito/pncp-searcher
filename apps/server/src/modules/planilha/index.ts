import { Elysia, t } from "elysia";
import ExcelJS from "exceljs";
import { PlanilhaService } from "./service";
import { ItensPlanilhaService } from "../itens_planilha/service";
import { ItensPlanilhaInsert } from "../itens_planilha/model";
import { authGuard } from "@/plugin/middleware";

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();

export const planilhasController = new Elysia({
  prefix: "/planilhas",
})
  .use(authGuard)
  .get(
    "/",
    async ({ query }) => {
      const pageSize = query.pageSize ?? 20;
      const cursor = query.cursor ?? undefined;
      const search = query.search ?? undefined;

      const [result, total] = await Promise.all([
        PlanilhaService.findAllCursor(pageSize, cursor, search),
        PlanilhaService.countAll(search),
      ]);

      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        total,
      };
    },
    {
      query: t.Object({
        cursor: t.Optional(t.String()),
        pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/",
    async ({ body, user }) => {
      const workbook = new ExcelJS.Workbook();
      const buffer = await body.planilha.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const headers = (worksheet.getRow(1).values as unknown[]).map(
        normalizeHeader,
      );

      const { planilha, ...rest } = body;
      const planilhaId = await PlanilhaService.create({
        ...rest,
        userId: user.id,
      });

      const HEADERS = [
        "ITEM",
        "UNIDADE",
        "QUANTIDADE",
        "DESCRICAO",
        "VALOR",
        "FONTE",
        "LINK",
      ] as const;

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
          unidade: String(item.UNIDADE ?? ""),
          quantidade: Number(item.QUANTIDADE ?? 0),
          descricao: String(item.DESCRICAO ?? ""),
          planilhaId: planilhaId[0].id,
          numero: Number(item.ITEM ?? 0),
          valor: Number(item.VALOR ?? 0),
          fonte: String(item.FONTE ?? ""),
          link: String(item.LINK ?? ""),
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
      body: t.Object({
        name: t.String({ minLength: 1 }),
      }),
    },
  )
  .delete("/:id", async ({ params }) => {
    await PlanilhaService.delete(params.id);
  })
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
        { header: "ITEM", key: "numero", width: 10 },
        { header: "DESCRIÇÃO", key: "descricao", width: 100 },
        { header: "UNIDADE", key: "unidade", width: 15 },
        { header: "QUANTIDADE", key: "quantidade", width: 15 },
        { header: "VALOR", key: "valor", width: 15 },
        { header: "TOTAL", key: "total", width: 15 },
        { header: "FONTE", key: "fonte", width: 70 },
        { header: "LINK", key: "link", width: 70 },
      ];

      for (const item of items) {
        worksheet.addRow({
          numero: item.numero,
          unidade: item.unidade,
          quantidade: item.quantidade,
          descricao: item.descricao,
          valor: item.valor,
          total: item.quantidade * item.valor,
          fonte: item.fonte,
          link: item.link,
        });
      }

      worksheet.getColumn("valor").numFmt = '"R$" #.##0,00';
      worksheet.getColumn("total").numFmt = '"R$" #.##0,00';
      worksheet.getColumn("descricao").alignment = { wrapText: true };
      worksheet.getColumn("fonte").alignment = { wrapText: true };
      worksheet.getColumn("link").alignment = { wrapText: true };

      const buffer = await workbook.xlsx.writeBuffer();

      const filename = `${planilha.name}.xlsx`;
      const encodedFilename = encodeURIComponent(filename)
        .replace(/['()]/g, escape)
        .replace(/\*/g, "%2A");

      set.headers["Content-Type"] =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      set.headers["Content-Disposition"] =
        `attachment; filename="${filename.replace(/[^\x00-\x7F]/g, "")}"; filename*=UTF-8''${encodedFilename}`;

      return new Response(buffer as ArrayBuffer);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
