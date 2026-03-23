import { t } from "elysia";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { planilhas } from "@/drizzle/migrations/schema";

export const _planilhaInsertSchema = createInsertSchema(planilhas);

export const planilhaInsertSchema = _planilhaInsertSchema;
export const planilhaSelectSchema = createSelectSchema(planilhas);
export const planilhaUpdateSchema = createUpdateSchema(planilhas);

export type PlanilhaInsert = typeof _planilhaInsertSchema.static;
export type PlanilhaSelect = typeof planilhaSelectSchema.static;
export type PlanilhaUpdate = typeof planilhaUpdateSchema.static;
