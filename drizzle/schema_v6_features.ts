/**
 * CAFETERIA V6 - New Feature Tables
 * Extensions for: Split Bill, Partial Payments, Waiter Escalation, Chef Routing, Kitchen Lock
 */

import { pgTable, text, timestamp, varchar, decimal, boolean, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// NEW ENUMS
// ============================================================================

export const billSplitStatusEnum = pgEnum("bill_split_status", [
  "pending",
  "partial_paid",
  "fully_paid",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "completed",
  "failed",
]);

export const escalationStatusEnum = pgEnum("escalation_status", [
  "pending",
  "escalated",
  "resolved",
  "timeout",
]);

// ============================================================================
// 1. BILL SPLITS TABLE - Split Bill Feature
// ============================================================================
export const billSplits = pgTable(
  "billSplits",
  {
    id: text("id").primaryKey().$defaultFn(() => `split_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    orderId: text("orderId").notNull(),
    status: billSplitStatusEnum("status").default("pending").notNull(),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().$onUpdate(() => new Date()).notNull(),
  }
);

export const billSplitsRelations = relations(billSplits, ({ many }) => ({
  items: many(billSplitItems),
  payments: many(billSplitPayments),
}));

export type BillSplit = typeof billSplits.$inferSelect;
export type InsertBillSplit = typeof billSplits.$inferInsert;

// ============================================================================
// 2. BILL SPLIT ITEMS TABLE - Items in a Split Bill
// ============================================================================
export const billSplitItems = pgTable(
  "billSplitItems",
  {
    id: text("id").primaryKey().$defaultFn(() => `item_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    billSplitId: text("billSplitId").notNull(),
    orderItemId: text("orderItemId").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
    customerId: text("customerId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export const billSplitItemsRelations = relations(billSplitItems, ({ one }) => ({
  billSplit: one(billSplits, {
    fields: [billSplitItems.billSplitId],
    references: [billSplits.id],
  }),
}));

export type BillSplitItem = typeof billSplitItems.$inferSelect;
export type InsertBillSplitItem = typeof billSplitItems.$inferInsert;

// ============================================================================
// 3. BILL SPLIT PAYMENTS TABLE - Partial Payments Feature
// ============================================================================
export const billSplitPayments = pgTable(
  "billSplitPayments",
  {
    id: text("id").primaryKey().$defaultFn(() => `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    billSplitId: text("billSplitId").notNull(),
    customerId: text("customerId"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar("paymentMethod", { length: 50 }).default("cash"),
    status: paymentStatusEnum("status").default("pending").notNull(),
    transactionId: varchar("transactionId", { length: 255 }),
    notes: text("notes"),
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export const billSplitPaymentsRelations = relations(billSplitPayments, ({ one }) => ({
  billSplit: one(billSplits, {
    fields: [billSplitPayments.billSplitId],
    references: [billSplits.id],
  }),
}));

export type BillSplitPayment = typeof billSplitPayments.$inferSelect;
export type InsertBillSplitPayment = typeof billSplitPayments.$inferInsert;

// ============================================================================
// 4. WAITER ESCALATIONS TABLE - Waiter Escalation Feature
// ============================================================================
export const waiterEscalations = pgTable(
  "waiterEscalations",
  {
    id: text("id").primaryKey().$defaultFn(() => `esc_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    orderId: text("orderId").notNull(),
    originalWaiterId: text("originalWaiterId"),
    escalatedAt: timestamp("escalatedAt").defaultNow().notNull(),
    status: escalationStatusEnum("status").default("pending").notNull(),
    visibleToAllWaiters: boolean("visibleToAllWaiters").default(false),
    visibleToManager: boolean("visibleToManager").default(false),
    resolvedBy: text("resolvedBy"),
    resolvedAt: timestamp("resolvedAt"),
    reason: text("reason"),
  }
);

export const waiterEscalationsRelations = relations(waiterEscalations, ({ one }) => ({
  // Relations would be added here
}));

export type WaiterEscalation = typeof waiterEscalations.$inferSelect;
export type InsertWaiterEscalation = typeof waiterEscalations.$inferInsert;

// ============================================================================
// 5. CHEF CATEGORY ASSIGNMENTS TABLE - Chef Routing Feature
// ============================================================================
export const chefCategoryAssignments = pgTable(
  "chefCategoryAssignments",
  {
    id: text("id").primaryKey().$defaultFn(() => `chef_cat_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    chefId: text("chefId").notNull(),
    categoryId: text("categoryId").notNull(),
    cafeteriaId: text("cafeteriaId").notNull(),
    isActive: boolean("isActive").default(true),
    assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  }
);

export const chefCategoryAssignmentsRelations = relations(chefCategoryAssignments, ({ one }) => ({
  // Relations would be added here
}));

export type ChefCategoryAssignment = typeof chefCategoryAssignments.$inferSelect;
export type InsertChefCategoryAssignment = typeof chefCategoryAssignments.$inferInsert;

// ============================================================================
// 6. KITCHEN LOCKS TABLE - Kitchen Lock Feature
// ============================================================================
export const kitchenLocks = pgTable(
  "kitchenLocks",
  {
    id: text("id").primaryKey().$defaultFn(() => `lock_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    orderItemId: text("orderItemId").notNull(),
    orderId: text("orderId").notNull(),
    lockedAt: timestamp("lockedAt").defaultNow().notNull(),
    lockedBy: text("lockedBy"),
    unlockedAt: timestamp("unlockedAt"),
    unlockedBy: text("unlockedBy"),
    reason: text("reason"),
    isLocked: boolean("isLocked").default(true),
  }
);

export const kitchenLocksRelations = relations(kitchenLocks, ({ one }) => ({
  // Relations would be added here
}));

export type KitchenLock = typeof kitchenLocks.$inferSelect;
export type InsertKitchenLock = typeof kitchenLocks.$inferInsert;

// ============================================================================
// 7. REAL-TIME UPDATES TABLE - WebSocket Event Tracking
// ============================================================================
export const realtimeEvents = pgTable(
  "realtimeEvents",
  {
    id: text("id").primaryKey().$defaultFn(() => `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`),
    cafeteriaId: text("cafeteriaId").notNull(),
    eventType: varchar("eventType", { length: 50 }).notNull(), // "order_created", "order_updated", "kitchen_update", "waiter_notification"
    orderId: text("orderId"),
    orderItemId: text("orderItemId"),
    payload: jsonb("payload"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"), // For cleanup
  }
);

export const realtimeEventsRelations = relations(realtimeEvents, ({ one }) => ({
  // Relations would be added here
}));

export type RealtimeEvent = typeof realtimeEvents.$inferSelect;
export type InsertRealtimeEvent = typeof realtimeEvents.$inferInsert;
