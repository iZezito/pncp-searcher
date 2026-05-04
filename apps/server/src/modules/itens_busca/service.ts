import { db } from "@/lib/db";
import { itensBusca } from "@/drizzle/migrations/schema";
import { eq, desc, count, and, or, ilike, lt, type SQL } from "drizzle-orm";
import type { ItensBuscaInsert } from "./model";

export abstract class ItensBuscaService {
  private static buildSearchCondition(userId: string, search?: string): SQL {
    const conditions: SQL[] = [eq(itensBusca.userId, userId)];

    if (search && search.trim().length > 0) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(itensBusca.descricao, pattern),
          ilike(itensBusca.fonte, pattern),
          ilike(itensBusca.unidadeMedida, pattern),
        )!,
      );
    }

    return and(...conditions)!;
  }

  static async create(item: ItensBuscaInsert) {
    return await db.insert(itensBusca).values(item).returning();
  }

  static async findByUserIdCursor(
    userId: string,
    pageSize: number,
    cursor?: string,
    search?: string,
  ) {
    const baseCondition = this.buildSearchCondition(userId, search);

    const conditions: SQL[] = [baseCondition];

    if (cursor) {
      const cursorItem = await this.findById(cursor);
      if (cursorItem) {
        conditions.push(lt(itensBusca.createdAt, cursorItem.createdAt));
      }
    }

    const data = await db
      .select()
      .from(itensBusca)
      .where(and(...conditions))
      .orderBy(desc(itensBusca.createdAt))
      .limit(pageSize + 1);

    const hasMore = data.length > pageSize;
    const items = hasMore ? data.slice(0, pageSize) : data;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return { data: items, nextCursor, hasMore };
  }

  static async countByUserId(userId: string, search?: string) {
    const result = await db
      .select({ total: count() })
      .from(itensBusca)
      .where(this.buildSearchCondition(userId, search));
    return result[0]?.total ?? 0;
  }

  static async findById(id: string) {
    const result = await db
      .select()
      .from(itensBusca)
      .where(eq(itensBusca.id, id));
    return result[0] ?? null;
  }

  static async delete(id: string) {
    return await db.delete(itensBusca).where(eq(itensBusca.id, id));
  }
}
