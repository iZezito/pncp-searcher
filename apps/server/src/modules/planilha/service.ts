import { planilhas } from "@/drizzle/migrations/schema";
import { PlanilhaInsert } from "./model";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export abstract class PlanilhaService {
  static async create(data: PlanilhaInsert) {
    return await db.insert(planilhas).values(data).returning({
      id: planilhas.id,
    });
  }

  static async findAll() {
    return await db.select().from(planilhas);
  }

  static async findById(id: string) {
    const result = await db.select().from(planilhas).where(eq(planilhas.id, id));
    return result[0] ?? null;
  }

  static async update(id: string, data: Partial<PlanilhaInsert>) {
    return await db.update(planilhas).set(data).where(eq(planilhas.id, id));
  }

  static async delete(id: string) {
    return await db.delete(planilhas).where(eq(planilhas.id, id));
  }
}
