import { defineMiddlewares } from "@medusajs/medusa";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { randomUUID } from "crypto";

// Module augmentation: declare the optional `requestId` field on the
// MedusaRequest type so we don't need an inline cast at every callsite.
declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    requestId?: string;
  }
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * Attach an x-request-id to every /store request and propagate it back
 * in the response. Reuses an upstream-provided header (e.g. from Caddy)
 * when present so the same id can be traced across the proxy.
 */
function requestIdMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
): void {
  const incoming = req.headers["x-request-id"];
  const requestId = (typeof incoming === "string" && incoming) || randomUUID();
  res.setHeader("x-request-id", requestId);
  req.requestId = requestId;
  next();
}

/**
 * Dev-only CORS debug middleware. Logs the origin of incoming requests so
 * mismatches between STORE_CORS / ADMIN_CORS / AUTH_CORS are visible during
 * local development. NOT registered in production to avoid log noise.
 */
function corsDebugMiddleware(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
): void {
  const origin = req.headers.origin;
  if (origin) {
    req.scope.resolve("logger")?.debug(`[CORS] ${req.method} ${req.path} from origin: ${origin}`);
  }
  next();
}

const routes = [
  {
    matcher: "/store/*",
    middlewares: [requestIdMiddleware],
  },
];

if (!isProduction) {
  routes.push({
    matcher: "/*",
    middlewares: [corsDebugMiddleware],
  });
}

export default defineMiddlewares({ routes });
