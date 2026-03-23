import { COOKIE_NAME } from "@shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter as coreSystemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { ordersRouter } from "./routers/orders.js";
import { systemRouter } from "./routers/system.js";
import { shiftsRouter } from "./routers/shifts.js";
import { reportingRouter } from "./routers/reporting.js";
import { menuRouter } from "./routers/menu.js";
import { tablesRouter } from "./routers/tables.js";
import { rechargesRouter } from "./routers/recharges.js";
import { staffRouter } from "./routers/staff.js";
import { withdrawalsRouter } from "./routers/withdrawals.js";
import { qrOrdersRouter } from "./routers/qr-orders.js";
import { marketersRouter } from "./routers/marketers.js";
import { commissionsRouter } from "./routers/commissions.js";
import { cafeteriasRouter } from "./routers/cafeterias.js";
import { authRouter } from "./routers/auth.js";
import { splitBillRouter } from "./routers/splitBill.js";
import { waiterEscalationRouter } from "./routers/waiterEscalation.js";
import { chefRoutingRouter } from "./routers/chefRouting.js";
import { realtimeUpdatesRouter } from "./routers/realtimeUpdates.js";
import { billingRouter } from "./routers/billing.js";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  coreSystem: coreSystemRouter,
  auth: authRouter,

  orders: ordersRouter,
  shifts: shiftsRouter,
  reporting: reportingRouter,
  menu: menuRouter,
  tables: tablesRouter,
  cafeterias: cafeteriasRouter,
  recharges: rechargesRouter,
  staff: staffRouter,
  withdrawals: withdrawalsRouter,
  qrOrders: qrOrdersRouter,
  marketers: marketersRouter,
  commissions: commissionsRouter,

  // V6 Features
  splitBill: splitBillRouter,
  waiterEscalation: waiterEscalationRouter,
  chefRouting: chefRoutingRouter,
  realtimeUpdates: realtimeUpdatesRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
