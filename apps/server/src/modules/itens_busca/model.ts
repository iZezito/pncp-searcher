import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { itensBusca } from "@/drizzle/migrations/schema";

export const itensBuscaSelectSchema = createSelectSchema(itensBusca);
export const itensBuscaInsertSchema = createInsertSchema(itensBusca);
export const itensBuscaUpdateSchema = createUpdateSchema(itensBusca);

export type ItensBusca = typeof itensBuscaSelectSchema.static;
export type ItensBuscaInsert = typeof itensBuscaInsertSchema.static;
export type ItensBuscaUpdate = typeof itensBuscaUpdateSchema.static;
