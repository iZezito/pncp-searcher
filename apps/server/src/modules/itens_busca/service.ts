import { db } from "@/lib/db";
import { itensBusca } from "@/drizzle/migrations/schema";
import { eq, desc, count } from "drizzle-orm";
import type { ItensBuscaInsert } from "./model";

export abstract class ItensBuscaService {
  static async create(item: ItensBuscaInsert) {
    return await db.insert(itensBusca).values(item).returning();
  }

  static async findByUserId(userId: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return await db
      .select()
      .from(itensBusca)
      .where(eq(itensBusca.userId, userId))
      .orderBy(desc(itensBusca.createdAt))
      .limit(pageSize)
      .offset(offset);
  }

  static async countByUserId(userId: string) {
    const result = await db
      .select({ total: count() })
      .from(itensBusca)
      .where(eq(itensBusca.userId, userId));
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
