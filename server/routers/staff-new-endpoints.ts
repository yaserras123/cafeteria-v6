// New endpoints to add to staff router
import { protectedProcedure } from "./_core/trpc.js";
import { z } from "zod";
import { getDb } from "./db.js";
import { cafeteriaStaff } from "./../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getDefaultPermissionsForRole, isValidStaffRole } from "./utils/staffPermissions.js";

export const updateStaffRoleEndpoint = protectedProcedure
  .input(
    z.object({
      staffId: z.string(),
      newRole: z.enum(["cafeteria_admin", "manager", "waiter", "chef"]),
    })
  )
  .mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (!isValidStaffRole(input.newRole)) {
      throw new Error(`Invalid staff role: ${input.newRole}`);
    }

    const permissions = getDefaultPermissionsForRole(input.newRole);

    await db
      .update(cafeteriaStaff)
      .set({
        role: input.newRole,
        permissions: JSON.stringify(permissions),
      })
      .where(eq(cafeteriaStaff.id, input.staffId));

    return {
      success: true,
      staffId: input.staffId,
      newRole: input.newRole,
      permissions,
    };
  });

export const toggleStaffLoginEndpoint = protectedProcedure
  .input(
    z.object({
      staffId: z.string(),
      enable: z.boolean(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const staffResult = await db
      .select()
      .from(cafeteriaStaff)
      .where(eq(cafeteriaStaff.id, input.staffId));

    if (staffResult.length === 0) {
      throw new Error("Staff not found");
    }

    const now = new Date();
    const updates: Record<string, any> = {
      canLogin: input.enable,
    };

    if (input.enable) {
      updates.loginPermissionGrantedAt = now;
      updates.loginPermissionGrantedBy = ctx.user?.name || "admin";
    }

    await db
      .update(cafeteriaStaff)
      .set(updates)
      .where(eq(cafeteriaStaff.id, input.staffId));

    return {
      success: true,
      staffId: input.staffId,
      canLogin: input.enable,
      updatedAt: now,
    };
  });
