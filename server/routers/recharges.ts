
/**
 * Recharge Router
 * Handles recharge requests, approval workflow, and commission distribution
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  rechargeRequests,
  cafeterias,
  ledgerEntries,
} from "../../drizzle/schema";
import { processCommissionsForRecharge } from "../db-commission-helpers";

export const rechargesRouter = router({
  /**
   * Create a recharge request
   */
  createRequest: protectedProcedure
    .input(
      z.object({
        cafeteriaId: z.string(),
        amount: z.number().positive(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const id = nanoid();
      const now = new Date();

      // Get cafeteria details for country, currency, language
      const cafeteriaResult = await db
        .select()
        .from(cafeterias)
        .where(eq(cafeterias.id, input.cafeteriaId))
        .limit(1);
      
      if (cafeteriaResult.length === 0) {
        throw new Error("Cafeteria not found");
      }

      const cafeteria = cafeteriaResult[0];

      await db.insert(rechargeRequests).values({
        id,
        cafeteriaId: input.cafeteriaId,
        amount: String(input.amount),
        imageUrl: input.imageUrl,
        status: "pending",
        commissionCalculated: false,
        country: cafeteria.country,
        currency: cafeteria.currency,
        language: cafeteria.language,
        createdAt: now,
      });

      // Create ledger entry for recharge request
      await db.insert(ledgerEntries).values({
        id: nanoid(),
        type: "recharge_requested",
        ledgerType: "points_credit",
        description: `Recharge requested: ${input.amount} points pending approval`,
        cafeteriaId: input.cafeteriaId,
        amount: String(input.amount),
        refId: id,
        createdAt: now,
      });

      return {
        success: true,
        rechargeId: id,
        amount: input.amount,
      };
    }),

  /**
   * Get all recharge requests (with optional filtering)
   */
  getRequests: protectedProcedure
    .input(
      z.object({
        cafeteriaId: z.string().optional(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.cafeteriaId) {
        conditions.push(eq(rechargeRequests.cafeteriaId, input.cafeteriaId));
      }
      if (input.status) {
        conditions.push(eq(rechargeRequests.status, input.status));
      }
      
      const requests = await db
        .select({
          recharge: rechargeRequests,
          cafeteria: cafeterias,
        })
        .from(rechargeRequests)
        .innerJoin(cafeterias, eq(rechargeRequests.cafeteriaId, cafeterias.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(input.limit)
        .offset(input.offset);

      return {
        total: requests.length,
        requests: requests.map((r) => ({
          id: r.recharge.id,
          cafeteriaId: r.recharge.cafeteriaId,
          cafeteria: {
            id: r.cafeteria.id,
            name: r.cafeteria.name,
            country: r.cafeteria.country,
            currency: r.cafeteria.currency,
          },
          amount: Number(r.recharge.amount) || 0,
          status: r.recharge.status,
          commissionCalculated: r.recharge.commissionCalculated,
          createdAt: r.recharge.createdAt,
          processedAt: r.recharge.processedAt,
        })),
      };
    }),

  /**
   * Get a single recharge request
   */
  getRequest: protectedProcedure
    .input(z.object({ rechargeRequestId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const requests = await db
        .select({
          recharge: rechargeRequests,
          cafeteria: cafeterias,
        })
        .from(rechargeRequests)
        .innerJoin(cafeterias, eq(rechargeRequests.cafeteriaId, cafeterias.id))
        .where(eq(rechargeRequests.id, input.rechargeRequestId));

      if (requests.length === 0) {
        return null;
      }

      const r = requests[0];
      return {
        id: r.recharge.id,
        cafeteriaId: r.recharge.cafeteriaId,
        cafeteria: {
          id: r.cafeteria.id,
          name: r.cafeteria.name,
          country: r.cafeteria.country,
          currency: r.cafeteria.currency,
        },
        amount: Number(r.recharge.amount) || 0,
        status: r.recharge.status,
        commissionCalculated: r.recharge.commissionCalculated,
        createdAt: r.recharge.createdAt,
        processedAt: r.recharge.processedAt,
        processedBy: r.recharge.processedBy,
        notes: r.recharge.notes,
        paidAmount: r.recharge.paidAmount ? Number(r.recharge.paidAmount) : undefined,
        paidCurrency: r.recharge.paidCurrency,
        exchangeRateToUsd: r.recharge.exchangeRateToUsd ? Number(r.recharge.exchangeRateToUsd) : undefined,
        pointsMultiplier: r.recharge.pointsMultiplier ? Number(r.recharge.pointsMultiplier) : undefined,
      };
    }),

  /**
   * Approve a recharge request
   */
  approveRequest: protectedProcedure
    .input(
      z.object({
        rechargeRequestId: z.string(),
        notes: z.string().optional(),
        approvedPoints: z.number().positive(),
        paidAmount: z.number().optional(),
        paidCurrency: z.string().optional(),
        exchangeRateToUsd: z.number().optional(),
        pointsMultiplier: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db.transaction(async (tx) => {
        // Get the recharge request and LOCK the row (RACE CONDITION PROTECTION)
        const requests = await tx
          .select()
          .from(rechargeRequests)
          .where(eq(rechargeRequests.id, input.rechargeRequestId))
          .for("update");

        if (requests.length === 0) {
          throw new Error("Recharge request not found");
        }

        const request = requests[0];

        // Prevent double approval (IDEMPOTENCY)
        if (request.status === "approved") {
          return { success: true, rechargeId: input.rechargeRequestId, alreadyApproved: true };
        }

        if (request.status !== "pending") {
          throw new Error(`Recharge request has already been processed (status: ${request.status})`);
        }

        const approvedPoints = input.approvedPoints;

        // Get cafeteria details
        const cafeterias_result = await tx
          .select()
          .from(cafeterias)
          .where(eq(cafeterias.id, request.cafeteriaId));

        if (cafeterias_result.length === 0) {
          throw new Error("Cafeteria not found");
        }

        const cafeteria = cafeterias_result[0] as any;

        // Update recharge request status
        const now = new Date();
        await tx
          .update(rechargeRequests)
          .set({
            status: "approved",
            processedAt: now,
            processedBy: ctx.user?.name || "admin",
            notes: input.notes,
            pointsAddedToBalance: String(approvedPoints),
            paidAmount: input.paidAmount ? String(input.paidAmount) : undefined,
            paidCurrency: input.paidCurrency,
            exchangeRateToUsd: input.exchangeRateToUsd ? String(input.exchangeRateToUsd) : undefined,
            pointsMultiplier: input.pointsMultiplier ? String(input.pointsMultiplier) : undefined,
          })
          .where(eq(rechargeRequests.id, input.rechargeRequestId));

        // Update cafeteria points balance
        const currentBalance = Number(cafeteria.pointsBalance) || 0;
        await tx
          .update(cafeterias)
          .set({
            pointsBalance: String(currentBalance + approvedPoints),
          })
          .where(eq(cafeterias.id, request.cafeteriaId));

        // Create ledger entry for approval with balance tracking
        await tx.insert(ledgerEntries).values({
          id: nanoid(),
          type: "recharge_approved",
          ledgerType: "points_credit",
          description: `Recharge approved: ${approvedPoints} points added (Original request: ${request.amount})`,
          cafeteriaId: request.cafeteriaId,
          amount: String(approvedPoints),
          balanceBefore: String(currentBalance),
          balanceAfter: String(currentBalance + approvedPoints),
          refId: input.rechargeRequestId,
          createdAt: now,
        });

        // Commission processing
        try {
          const cafeteriaMarketerId = (cafeteria as any).marketerId || null;
          if (cafeteriaMarketerId) {
            await processCommissionsForRecharge(
              tx,
              input.rechargeRequestId,
              cafeteriaMarketerId,
              approvedPoints,
              request.cafeteriaId
            );
          } else {
            console.warn(
              `[Commission Processing] No marketer associated with cafeteria ${request.cafeteriaId}`
            );
            await tx
              .update(rechargeRequests)
              .set({ commissionCalculated: true })
              .where(eq(rechargeRequests.id, input.rechargeRequestId));
          }
        } catch (commissionError) {
          console.error(
            `[Commission Processing] Error processing commissions for recharge ${input.rechargeRequestId}:`,
            commissionError
          );
          // If commission processing fails, the transaction will be rolled back.
          throw new Error("Commission processing failed");
        }

        return {
          success: true,
          rechargeId: input.rechargeRequestId,
          pointsAdded: approvedPoints,
          newBalance: currentBalance + approvedPoints,
        };
      });
    }),

  /**
   * Reject a recharge request
   */
  rejectRequest: protectedProcedure
    .input(
      z.object({
        rechargeRequestId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db.transaction(async (tx) => {
        // IDEMPOTENCY: Check current status
        const requests = await tx
          .select()
          .from(rechargeRequests)
          .where(eq(rechargeRequests.id, input.rechargeRequestId))
          .for("update"); // Lock the row

        if (requests.length === 0) {
          throw new Error("Recharge request not found");
        }

        const request = requests[0];

        // If already processed, return safely (Idempotency)
        if (request.status === "rejected") {
          return { success: true, rechargeId: input.rechargeRequestId, alreadyProcessed: true };
        }

        if (request.status !== "pending") {
          throw new Error(`Recharge request has already been processed (status: ${request.status})`);
        }

        const now = new Date();
        await tx
          .update(rechargeRequests)
          .set({
            status: "rejected",
            processedAt: now,
            processedBy: ctx.user?.name || "admin",
            notes: input.reason,
          })
          .where(eq(rechargeRequests.id, input.rechargeRequestId));

        // Create ledger entry for rejection
        await tx.insert(ledgerEntries).values({
          id: nanoid(),
          type: "recharge_rejected",
          ledgerType: "points_cancelled",
          description: `Recharge rejected: ${input.reason}`,
          cafeteriaId: request.cafeteriaId,
          refId: input.rechargeRequestId,
          createdAt: now,
        });

        return {
          success: true,
          rechargeId: input.rechargeRequestId,
        };
      });
    }),
});
