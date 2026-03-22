import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { cafeterias } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acpi",
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe events and updates the cafeteria subscription plan in the database.
 *
 * Events handled:
 *   - checkout.session.completed: Update cafeteria plan when checkout is successful
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  // Get the raw body for signature verification
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.warn("Stripe webhook: Missing signature");
    return res.status(400).json({ error: "Missing signature" });
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("Stripe webhook: STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, // This must be the raw body, not parsed JSON
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract cafeteriaId and plan from metadata
      const cafeteriaId = session.metadata?.cafeteriaId;
      const plan = session.metadata?.plan as "growth" | "pro";

      if (!cafeteriaId || !plan) {
        console.warn("Stripe webhook: Missing metadata", { cafeteriaId, plan });
        return res.status(400).json({ error: "Missing metadata" });
      }

      // Validate plan
      if (!["growth", "pro"].includes(plan)) {
        console.warn("Stripe webhook: Invalid plan", { plan });
        return res.status(400).json({ error: "Invalid plan" });
      }

      // Update the cafeteria subscription plan in the database
      const db = await getDb();
      if (!db) {
        console.error("Stripe webhook: Database not available");
        return res.status(500).json({ error: "Database error" });
      }

      try {
        await db
          .update(cafeterias)
          .set({
            subscriptionPlan: plan,
            subscriptionStatus: "active",
          })
          .where(eq(cafeterias.id, cafeteriaId));

        console.log(`Stripe webhook: Updated cafeteria ${cafeteriaId} to plan ${plan}`);
        return res.status(200).json({ received: true });
      } catch (dbError) {
        console.error("Stripe webhook: Database update error:", dbError);
        return res.status(500).json({ error: "Database update failed" });
      }
    }

    // For other events, just acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Stripe webhook: Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
