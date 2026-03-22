/**
 * ensureTestUsers
 *
 * Idempotently creates required seed / test users on server startup.
 * Safe to call multiple times — skips insertion if the user already exists.
 */
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import bcryptjs from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function ensureTestUsers(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[ensureTestUsers] Database not available — skipping.");
    return;
  }

  // ── Test admin: admin@cafeteria.com / 123456 ────────────────────────────────
  const adminEmail = "admin@cafeteria.com";
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail));

  if (existing.length === 0) {
    const adminPassword = "123456";
    const adminPasswordHash = await hashPassword(adminPassword);
    const adminId = nanoid();
    const adminOpenId = `admin_${adminId}`;

    await db.insert(users).values({
      id: adminId,
      openId: adminOpenId,
      name: "Cafeteria Admin",
      email: adminEmail,
      loginUsername: adminEmail,
      passwordHash: adminPasswordHash,
      loginMethod: "email",
      role: "cafeteria_admin",
      preferredLanguage: "en",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    console.log("[ensureTestUsers] ✅ Test admin user created: admin@cafeteria.com");
  } else {
    console.log("[ensureTestUsers] ℹ️  Test admin user already exists — skipping.");
  }
}
