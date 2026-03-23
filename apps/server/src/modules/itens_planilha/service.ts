import {
  ItensPlanilha,
  ItensPlanilhaInsert,
  ItensPlanilhaUpdate,
} from "@/modules/itens_planilha/model";
import { db } from "@/lib/db";
import { itens } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";

export abstract class ItensPlanilhaService {
  static async create(itensPlanilha: ItensPlanilhaInsert[]) {
    return await db.insert(itens).values(itensPlanilha);
  }

  static async findByPlanilhaId(planilhaId: string) {
    return await db
      .select()
      .from(itens)
      .where(eq(itens.planilhaId, planilhaId));
  }

  static async update(
    itemPlanilha: ItensPlanilhaUpdate,
    itemPlanilhaId: string,
  ) {
    return await db
      .update(itens)
      .set(itemPlanilha)
      .where(eq(itens.id, itemPlanilhaId));
  }

  static async delete(id: string) {
    return await db.delete(itens).where(eq(itens.id, id));
  }
}
