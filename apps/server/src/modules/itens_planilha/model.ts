import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { itens } from "@/drizzle/migrations/schema";

export const itensPlanilhaSelectSchema = createSelectSchema(itens);
export const itensPlanilhaInsertSchema = createInsertSchema(itens);
export const itensPlanilhaUpdateSchema = createUpdateSchema(itens);

export type ItensPlanilha = typeof itensPlanilhaSelectSchema.static;
export type ItensPlanilhaInsert = typeof itensPlanilhaInsertSchema.static;
export type ItensPlanilhaUpdate = typeof itensPlanilhaUpdateSchema.static;
