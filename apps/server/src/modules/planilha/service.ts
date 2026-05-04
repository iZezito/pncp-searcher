import { planilhas } from "@/drizzle/migrations/schema";
import { PlanilhaInsert } from "./model";
import { db } from "@/lib/db";
import { eq, desc, count, and, ilike, lt, type SQL } from "drizzle-orm";

export abstract class PlanilhaService {
  private static buildSearchCondition(search?: string): SQL | undefined {
    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      return ilike(planilhas.name, pattern);
    }
    return undefined;
  }

  static async create(data: PlanilhaInsert) {
    return await db.insert(planilhas).values(data).returning({
      id: planilhas.id,
    });
  }

  static async findAllCursor(
    pageSize: number,
    cursor?: string,
    search?: string,
  ) {
    const conditions: SQL[] = [];

    const searchCondition = this.buildSearchCondition(search);
    if (searchCondition) {
      conditions.push(searchCondition);
    }

    if (cursor) {
      const cursorItem = await this.findById(cursor);
      if (cursorItem) {
        conditions.push(lt(planilhas.id, cursorItem.id));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(planilhas)
      .where(where)
      .orderBy(desc(planilhas.id))
      .limit(pageSize + 1);

    const hasMore = data.length > pageSize;
    const items = hasMore ? data.slice(0, pageSize) : data;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return { data: items, nextCursor, hasMore };
  }

  static async countAll(search?: string) {
    const searchCondition = this.buildSearchCondition(search);
    const result = await db
      .select({ total: count() })
      .from(planilhas)
      .where(searchCondition);
    return result[0]?.total ?? 0;
  }

  static async findById(id: string) {
    const result = await db
      .select()
      .from(planilhas)
      .where(eq(planilhas.id, id));
    return result[0] ?? null;
  }

  static async update(id: string, data: Partial<PlanilhaInsert>) {
    return await db
      .update(planilhas)
      .set(data)
      .where(eq(planilhas.id, id))
      .returning();
  }

  static async delete(id: string) {
    return await db.delete(planilhas).where(eq(planilhas.id, id));
  }
}
