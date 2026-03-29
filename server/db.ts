import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
import {
  InsertUser,
  users,
  marketers,
  cafeterias,
  rechargeRequests,
  ledgerEntries,
  marketerBalances,
  commissionDistributions,
  withdrawalRequests,
  cafeteriaMarketerRelationships,
  freeOperationPeriods,
  sections,
  cafeteriaTables,
  cafeteriaStaff,
  staffSectionAssignments,
  staffCategoryAssignments,
  menuCategories,
  menuItems,
  orders,
  systemConfigs,
  type MarketerBalance,
  type CommissionDistribution,
  type FreeOperationPeriod,
  type Cafeteria,
  type Marketer,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';
import { addPrecise, subtractPrecise, roundTo } from "./utils/precision.js";
import { logger } from "./utils/logger.js";

import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  try {
    if (!_db && process.env.DATABASE_URL) {
      const connectionString = process.env.DATABASE_URL;
      
      // In serverless, we want to reuse the pool if it exists
      if (!_pool) {
        // Most cloud Postgres providers (Supabase, Neon, AWS) require SSL in production
        const useSSL = process.env.NODE_ENV === "production" || 
                      connectionString?.includes('supabase') ||
                      connectionString?.includes('.pooler.') ||
                      connectionString?.includes('neon.tech');

        _pool = new Pool({
          connectionString,
          max: 1, // Serverless: one connection per instance to avoid exhaustion
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: useSSL ? { rejectUnauthorized: false } : false,
        });

        // Error handling for the pool
        _pool.on('error', (err) => {
          console.error('[Database] Unexpected error on idle client', err);
          _db = null;
          _pool = null;
        });
      }

      _db = drizzle(_pool, { schema }) as any;
    }
    return _db;
  } catch (error: any) {
    console.error("[Database] Failed to connect:", error);
    if (logger) {
      logger.error("DATABASE_CONNECTION_FAILED", error.message);
    }
    _db = null;
    _pool = null;
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: nanoid(), // Add id for new user
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    // Role preservation: if the user already has the 'owner' role, keep it.
    // Otherwise, fallback to the ENV.ownerOpenId check.
    if (user.role === 'owner' || user.openId === ENV.ownerOpenId) {
      values.role = 'owner';
      updateSet.role = 'owner';
    } else if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  if (result.length === 0) return undefined;

  const user = result[0];

  // If user is a manager/waiter/chef, they might have a cafeteriaId through cafeteriaStaff
  if (!user.cafeteriaId) {
    const staff = await db
      .select()
      .from(cafeteriaStaff)
      .where(eq(cafeteriaStaff.userId, user.id))
      .limit(1);
    
    if (staff.length > 0) {
      (user as any).cafeteriaId = staff[0].cafeteriaId;
    }
  }

  // If user is a marketer, they should have a marketerId
  if (!user.marketerId && user.role === 'marketer') {
    const marketer = await db
      .select()
      .from(marketers)
      .where(eq(marketers.email, user.email || ""))
      .limit(1);
    
    if (marketer.length > 0) {
      (user as any).marketerId = marketer[0].id;
      (user as any).referenceCode = marketer[0].referenceCode;
    }
  }

  return user;
}

export async function getOrCreateMarketerBalance(marketerId: string): Promise<MarketerBalance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(marketerBalances)
    .where(eq(marketerBalances.marketerId, marketerId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const id = nanoid();
  await db.insert(marketerBalances).values({
    id,
    marketerId,
    pendingBalance: "0",
    availableBalance: "0",
    totalWithdrawn: "0",
  });

  return {
    id,
    marketerId,
    pendingBalance: "0",
    availableBalance: "0",
    totalWithdrawn: "0",
    lastUpdated: new Date(),
  } as MarketerBalance;
}

export async function getMarketerBalance(marketerId: string): Promise<MarketerBalance | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(marketerBalances)
    .where(eq(marketerBalances.marketerId, marketerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function transitionCommissionsToAvailable(marketerId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    const pendingCommissions = await tx
      .select()
      .from(commissionDistributions)
      .where(
        and(
          eq(commissionDistributions.marketerId, marketerId),
          eq(commissionDistributions.status, "pending")
        )
      );
      // .for("update"); // PostgreSQL equivalent is different, will handle if needed

    if (pendingCommissions.length === 0) {
      return;
    }

    const totalPending = pendingCommissions.reduce((sum, c) => addPrecise(sum, c.commissionAmount), 0);

    if (totalPending > 0) {
      await tx
        .update(commissionDistributions)
        .set({ status: "available" })
        .where(and(eq(commissionDistributions.marketerId, marketerId), eq(commissionDistributions.status, "pending")));

      const balance = await tx.select().from(marketerBalances).where(eq(marketerBalances.marketerId, marketerId)).limit(1).then(res => res[0]);
      
      if (!balance) {
        await tx.insert(marketerBalances).values({
          id: nanoid(),
          marketerId,
          pendingBalance: '0',
          availableBalance: String(totalPending),
          totalWithdrawn: '0',
          lastUpdated: new Date(),
        });
      } else {
        const newPending = subtractPrecise(balance.pendingBalance ?? '0', totalPending);
        const newAvailable = addPrecise(balance.availableBalance ?? '0', totalPending);

        await tx
          .update(marketerBalances)
          .set({
            pendingBalance: String(Math.max(0, newPending)),
            availableBalance: String(newAvailable),
            lastUpdated: new Date(),
          })
          .where(eq(marketerBalances.marketerId, marketerId));
      }
    }
  });
}

export async function createWithdrawalRequest(
  marketerId: string,
  amount: number
): Promise<WithdrawalRequest> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const balance = await getMarketerBalance(marketerId);
  if (!balance || Number(balance.availableBalance) < amount) {
    throw new Error("Insufficient available balance");
  }

  const id = nanoid();
  const now = new Date();

  await db.insert(withdrawalRequests).values({
    id,
    marketerId,
    amount: String(amount),
    status: "pending",
    requestedAt: now,
  });

  return {
    id,
    marketerId,
    amount: String(amount),
    status: "pending" as const,
    requestedAt: now,
  } as WithdrawalRequest;
}

export async function grantStaffLoginPermission(staffId: string, grantedBy?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(cafeteriaStaff).set({
    canLogin: true,
    loginPermissionGrantedAt: new Date(),
    loginPermissionGrantedBy: grantedBy || null,
  }).where(eq(cafeteriaStaff.id, staffId));
}

export async function revokeStaffLoginPermission(staffId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(cafeteriaStaff).set({ canLogin: false }).where(eq(cafeteriaStaff.id, staffId));
}

export async function canStaffLogin(staffId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ canLogin: cafeteriaStaff.canLogin }).from(cafeteriaStaff).where(eq(cafeteriaStaff.id, staffId)).limit(1);
  return result[0]?.canLogin ?? false;
}

export async function assignStaffToSection(staffId: string, sectionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(staffSectionAssignments).values({
    id: nanoid(),
    staffId,
    sectionId,
  });
}

export async function getStaffSectionAssignments(staffId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(staffSectionAssignments).where(eq(staffSectionAssignments.staffId, staffId));
}

export async function assignStaffToCategory(staffId: string, categoryId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(staffCategoryAssignments).values({
    id: nanoid(),
    staffId,
    categoryId,
  });
}

export async function getStaffCategoryAssignments(staffId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(staffCategoryAssignments).where(eq(staffCategoryAssignments.staffId, staffId));
}

export async function createSection(cafeteriaId: string, name: string, displayOrder?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = nanoid();
  await db.insert(sections).values({
    id,
    cafeteriaId,
    name,
    displayOrder: displayOrder || 0,
  });
  return id;
}

export async function getSectionsByCafeteria(cafeteriaId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(sections).where(eq(sections.cafeteriaId, cafeteriaId));
}

export async function getCommissionDistributions(rechargeRequestId: string): Promise<CommissionDistribution[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(commissionDistributions)
    .where(eq(commissionDistributions.rechargeRequestId, rechargeRequestId));
}
