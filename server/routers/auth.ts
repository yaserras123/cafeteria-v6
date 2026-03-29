/**
 * Authentication Router - Local Username/Password Authentication
 * Handles login, logout, password change, and user creation
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, marketerProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "../db.js";
import { users, marketers, cafeterias, cafeteriaStaff } from "../../drizzle/schema.js";
import bcryptjs from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { sdk } from "../_core/sdk.js";

const SALT_ROUNDS = 10;

/**
 * Hash password using bcryptjs
 */
async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Generate a unique username
 */
async function generateUniqueUsername(baseName: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  
  let username = baseName.toLowerCase().replace(/\s+/g, "_");
  let counter = 1;
  
  while (true) {
    const existing = await db.select().from(users).where(eq(users.loginUsername, username));
    if (existing.length === 0) {
      break;
    }
    username = `${baseName.toLowerCase().replace(/\s+/g, "_")}_${counter}`;
    counter++;
  }
  
  return username;
}

/**
 * Map a staff role (from cafeteriaStaff.role) to the canonical user role
 * used for dashboard routing.
 */
function mapStaffRole(staffRole: string): string {
  switch (staffRole) {
    case "cafeteria_admin":
      return "admin";
    case "manager":
      return "manager";
    case "waiter":
      return "waiter";
    case "chef":
      return "chef";
    default:
      return "manager";
  }
}

export const authRouter = router({
  /**
   * Login with email/username and password.
   *
   * Lookup order:
   *   1. users table  (role: owner | marketer | cafeteria_admin | manager | waiter | chef)
   *   2. marketers table
   *   3. cafeterias table
   *   4. cafeteriaStaff table
   *
   * Returns: { success, message, role, name, referenceCode? }
   *   role is one of: "owner" | "marketer" | "admin" | "manager" | "waiter" | "chef"
   *
   * ALWAYS returns valid JSON — never throws an unhandled error.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, "Email is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available. Please try again later.",
          });
        }

        const identifier = input.email.trim();

        // ── 1. Check users table (by loginUsername OR email) ──────────────────
        let userRow = (
          await db.select().from(users).where(eq(users.loginUsername, identifier))
        )[0];

        if (!userRow) {
          userRow = (
            await db.select().from(users).where(eq(users.email, identifier))
          )[0];
        }

        if (userRow && userRow.passwordHash) {
          const isValid = await verifyPassword(input.password, userRow.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password",
            });
          }

          // Determine canonical role for routing
          const dbRole = userRow.role ?? "cafeteria_admin";
          let role: string;
          if (dbRole === "owner") {
            role = "owner";
          } else if (dbRole === "marketer") {
            role = "marketer";
          } else if (dbRole === "cafeteria_admin") {
            role = "admin";
          } else if (dbRole === "manager") {
            role = "manager";
          } else if (dbRole === "waiter") {
            role = "waiter";
          } else if (dbRole === "chef") {
            role = "chef";
          } else {
            role = "admin";
          }

          const sessionToken = await sdk.createSessionToken(userRow.openId, {
            name: userRow.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            message: "Login successful",
            role,
            name: userRow.name,
            referenceCode: userRow.referenceCode ?? null,
          };
        }

        // ── 2. Check marketers table ───────────────────────────────────────────
        let marketerRow = (
          await db.select().from(marketers).where(eq(marketers.loginUsername, identifier))
        )[0];

        if (!marketerRow) {
          marketerRow = (
            await db.select().from(marketers).where(eq(marketers.email, identifier))
          )[0];
        }

        if (marketerRow && marketerRow.passwordHash) {
          const isValid = await verifyPassword(input.password, marketerRow.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password",
            });
          }

          const openId = `marketer_${marketerRow.id}`;
          const sessionToken = await sdk.createSessionToken(openId, {
            name: marketerRow.name,
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            message: "Login successful",
            role: "marketer",
            name: marketerRow.name,
            referenceCode: marketerRow.referenceCode ?? null,
          };
        }

        // ── 3. Check cafeterias table ──────────────────────────────────────────
        const cafeteriaRow = (
          await db.select().from(cafeterias).where(eq(cafeterias.loginUsername, identifier))
        )[0];

        if (cafeteriaRow && cafeteriaRow.passwordHash) {
          const isValid = await verifyPassword(input.password, cafeteriaRow.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password",
            });
          }

          const openId = `cafeteria_${cafeteriaRow.id}`;
          const sessionToken = await sdk.createSessionToken(openId, {
            name: cafeteriaRow.name,
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            message: "Login successful",
            role: "admin",
            name: cafeteriaRow.name,
            referenceCode: cafeteriaRow.referenceCode ?? null,
          };
        }

        // ── 4. Check cafeteriaStaff table ──────────────────────────────────────
        const staffRow = (
          await db.select().from(cafeteriaStaff).where(eq(cafeteriaStaff.loginUsername, identifier))
        )[0];

        if (staffRow && staffRow.passwordHash) {
          const isValid = await verifyPassword(input.password, staffRow.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password",
            });
          }

          const openId = `staff_${staffRow.id}`;
          const sessionToken = await sdk.createSessionToken(openId, {
            name: staffRow.name,
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          const role = mapStaffRole(staffRow.role ?? "manager");

          return {
            success: true,
            message: "Login successful",
            role,
            name: staffRow.name,
            referenceCode: null,
          };
        }

        // ── No matching account found ──────────────────────────────────────────
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });

      } catch (error) {
        // Re-throw TRPCErrors as-is so tRPC serializes them correctly
        if (error instanceof TRPCError) {
          throw error;
        }
        // Wrap any unexpected error so the response is always valid JSON
        console.error("[auth.login] Unexpected error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }),

  /**
   * Change password for logged-in user
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().min(1, "Old password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });

        // Get user from database
        const user = (await db.select().from(users).where(eq(users.id, ctx.user.id)))[0];
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found or password not set" });
        }

        // Verify old password
        const isValid = await verifyPassword(input.oldPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Old password is incorrect" });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(input.newPassword);

        // Update password
        await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[auth.changePassword] Unexpected error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." });
      }
    }),

  /**
   * Create user credentials (for owner/admin to create marketer/cafeteria/staff accounts)
   */
  createUserCredentials: adminProcedure
    .input(
      z.object({
        entityId: z.string(),
        entityType: z.enum(["marketer", "cafeteria", "staff"]),
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const passwordHash = await hashPassword(input.password);

        if (input.entityType === "marketer") {
          const marketer = (await db.select().from(marketers).where(eq(marketers.id, input.entityId)))[0];
          if (!marketer) throw new TRPCError({ code: "NOT_FOUND", message: "Marketer not found" });

          const existing = await db.select().from(marketers).where(eq(marketers.loginUsername, input.username));
          if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });

          await db.update(marketers).set({ loginUsername: input.username, passwordHash }).where(eq(marketers.id, input.entityId));

          return {
            success: true,
            message: "Marketer credentials created",
            username: input.username,
            entityType: "marketer",
          };
        } else if (input.entityType === "cafeteria") {
          const cafeteria = (await db.select().from(cafeterias).where(eq(cafeterias.id, input.entityId)))[0];
          if (!cafeteria) throw new TRPCError({ code: "NOT_FOUND", message: "Cafeteria not found" });

          const existing = await db.select().from(cafeterias).where(eq(cafeterias.loginUsername, input.username));
          if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });

          await db.update(cafeterias).set({ loginUsername: input.username, passwordHash }).where(eq(cafeterias.id, input.entityId));

          return {
            success: true,
            message: "Cafeteria credentials created",
            username: input.username,
            entityType: "cafeteria",
          };
        } else if (input.entityType === "staff") {
          const staff = (await db.select().from(cafeteriaStaff).where(eq(cafeteriaStaff.id, input.entityId)))[0];
          if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });

          const existing = await db.select().from(cafeteriaStaff).where(eq(cafeteriaStaff.loginUsername, input.username));
          if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });

          await db.update(cafeteriaStaff).set({ loginUsername: input.username, passwordHash }).where(eq(cafeteriaStaff.id, input.entityId));

          return {
            success: true,
            message: "Staff credentials created",
            username: input.username,
            entityType: "staff",
          };
        }

        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid entity type" });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[auth.createUserCredentials] Unexpected error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." });
      }
    }),

  /**
   * Get current user info (from session cookie)
   */
  me: publicProcedure.query(opts => ({
    user: opts.ctx.user
  })),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    try {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    } catch (error) {
      console.error("[auth.logout] Unexpected error:", error);
      // Still return success — logout should never fail from the client's perspective
      return { success: true } as const;
    }
  }),
});
