/**
 * Vercel Serverless Function Entry Point
 *
 * This file is the single serverless function that handles all /api/* requests
 * on Vercel. It imports the Express app and adapts it for the serverless runtime.
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.js";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import { handleStripeWebhook } from "../server/webhooks/stripe.js";
import { ensureTestUsers } from "../server/utils/ensureTestUsers.js";

const app = express();

// Stripe webhook handler (must be before JSON parsing for signature verification)
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Ensure test users exist (non-blocking, runs once per cold start)
ensureTestUsers().catch(err =>
  console.warn("[startup] ensureTestUsers failed (non-fatal):", err)
);

export default app;
