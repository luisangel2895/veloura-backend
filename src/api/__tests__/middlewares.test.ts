import { describe, it, expect, vi } from "vitest";

// Mock Medusa's defineMiddlewares to capture the config object verbatim
// (so the test can introspect routes/middlewares).
vi.mock("@medusajs/medusa", () => ({
  defineMiddlewares: (config: unknown) => config,
}));

// Mock crypto.randomUUID for deterministic assertions
vi.mock("crypto", () => ({
  randomUUID: () => "test-uuid-1234",
}));

interface MockReq {
  headers: Record<string, string | undefined>;
  requestId?: string;
  scope?: { resolve: (key: string) => { debug: ReturnType<typeof vi.fn> } | undefined };
  method?: string;
  path?: string;
}

interface MockRes {
  setHeader?: (key: string, val: string) => void;
}

type MiddlewareFn = (req: MockReq, res: MockRes, next: () => void) => void;

interface RouteShape {
  matcher: string;
  middlewares: MiddlewareFn[];
}

interface MiddlewareConfigShape {
  routes: RouteShape[];
}

async function loadConfig(env: "production" | "development"): Promise<MiddlewareConfigShape> {
  vi.resetModules();
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  try {
    const mod = await import("../../api/middlewares.js");
    return mod.default as unknown as MiddlewareConfigShape;
  } finally {
    process.env.NODE_ENV = previousEnv;
  }
}

describe("middleware configuration", () => {
  it("exposes a /store/* route in both prod and dev", async () => {
    for (const env of ["production", "development"] as const) {
      const cfg = await loadConfig(env);
      const storeRoute = cfg.routes.find((r) => r.matcher === "/store/*");
      expect(storeRoute, `missing /store/* route in ${env}`).toBeDefined();
      expect(storeRoute!.middlewares.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("registers the dev-only CORS debug middleware in development", async () => {
    const cfg = await loadConfig("development");
    const globalRoute = cfg.routes.find((r) => r.matcher === "/*");
    expect(globalRoute).toBeDefined();
  });

  it("does NOT register the dev-only CORS debug middleware in production", async () => {
    const cfg = await loadConfig("production");
    const globalRoute = cfg.routes.find((r) => r.matcher === "/*");
    expect(globalRoute).toBeUndefined();
  });

  describe("store request-id middleware", () => {
    it("sets x-request-id from header when provided", async () => {
      const cfg = await loadConfig("development");
      const storeMiddleware = cfg.routes.find((r) => r.matcher === "/store/*")!
        .middlewares[0];

      const req: MockReq = { headers: { "x-request-id": "existing-id-456" } };
      const setHeaderCalls: [string, string][] = [];
      const res: MockRes = {
        setHeader: (key: string, val: string) => {
          setHeaderCalls.push([key, val]);
        },
      };
      const next = vi.fn();

      storeMiddleware(req, res, next);

      expect(setHeaderCalls).toContainEqual(["x-request-id", "existing-id-456"]);
      expect(req.requestId).toBe("existing-id-456");
      expect(next).toHaveBeenCalledOnce();
    });

    it("generates a UUID when x-request-id header is not present", async () => {
      const cfg = await loadConfig("development");
      const storeMiddleware = cfg.routes.find((r) => r.matcher === "/store/*")!
        .middlewares[0];

      const req: MockReq = { headers: {} };
      const setHeaderCalls: [string, string][] = [];
      const res: MockRes = {
        setHeader: (key: string, val: string) => {
          setHeaderCalls.push([key, val]);
        },
      };
      const next = vi.fn();

      storeMiddleware(req, res, next);

      expect(setHeaderCalls).toContainEqual(["x-request-id", "test-uuid-1234"]);
      expect(req.requestId).toBe("test-uuid-1234");
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("dev-only CORS debug middleware", () => {
    it("calls next() and logs origin when present", async () => {
      const cfg = await loadConfig("development");
      const corsMiddleware = cfg.routes.find((r) => r.matcher === "/*")!
        .middlewares[0];

      const debugFn = vi.fn();
      const req: MockReq = {
        headers: { origin: "http://localhost:3000" },
        scope: { resolve: () => ({ debug: debugFn }) },
        method: "GET",
        path: "/store/products",
      };
      const res: MockRes = {};
      const next = vi.fn();

      corsMiddleware(req, res, next);

      expect(debugFn).toHaveBeenCalledWith(
        "[CORS] GET /store/products from origin: http://localhost:3000",
      );
      expect(next).toHaveBeenCalledOnce();
    });

    it("calls next() but does not log when no origin header", async () => {
      const cfg = await loadConfig("development");
      const corsMiddleware = cfg.routes.find((r) => r.matcher === "/*")!
        .middlewares[0];

      const debugFn = vi.fn();
      const req: MockReq = {
        headers: {},
        scope: { resolve: () => ({ debug: debugFn }) },
        method: "GET",
        path: "/store/products",
      };
      const res: MockRes = {};
      const next = vi.fn();

      corsMiddleware(req, res, next);

      expect(debugFn).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
