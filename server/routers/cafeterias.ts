import { protectedProcedure, router } from "../_core/trpc.js";
import { z } from "zod";
import { getDb } from "../db.js";
import { cafeterias } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";
import { getPlanContext } from "../utils/planGuard.js";

export const cafeteriasRouter = router({
  getCafeteriaDetails: protectedProcedure
    .input(z.object({ cafeteriaId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cafeteria = await (db.query as any).cafeterias.findFirst({
        where: eq(cafeterias.id, input.cafeteriaId),
      });

      if (!cafeteria) {
        throw new Error("Cafeteria not found");
      }
      return cafeteria;
    }),

  /**
   * Returns the subscription plan and feature limits for a cafeteria.
   * Used by the frontend to enforce plan-based UI restrictions.
   */
  getPlanContext: protectedProcedure
    .input(z.object({ cafeteriaId: z.string() }))
    .query(async ({ input }) => {
      return getPlanContext(input.cafeteriaId);
    }),
});
