import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { appRouter } from "./routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function createServerApp() {
  const app = express();
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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    // In development, we need the http server for Vite HMR
    const server = createServer(app);
    setupVite(app, server).then(() => {
      const preferredPort = parseInt(process.env.PORT || "3000");
      findAvailablePort(preferredPort).then(port => {
        server.listen(port, () => {
          console.log(`Server running on http://localhost:${port}/`);
        });
      });
    });
  } else {
    serveStatic(app);
  }
  return app;
}

const app = createServerApp();
export default app;

if (process.env.NODE_ENV !== "development" && !process.env.VERCEL) {
  const preferredPort = parseInt(process.env.PORT || "3000");
  findAvailablePort(preferredPort).then(port => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  });
}
