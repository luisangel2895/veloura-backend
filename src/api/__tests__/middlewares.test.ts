import { describe, it, expect, vi } from "vitest";

// Mock Medusa's defineMiddlewares to capture the config object
vi.mock("@medusajs/medusa", () => ({
  defineMiddlewares: (config: unknown) => config,
}));

// Mock crypto.randomUUID
vi.mock("crypto", () => ({
  randomUUID: () => "test-uuid-1234",
}));

import middlewareConfig from "../../api/middlewares";

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

describe("middleware configuration", () => {
  it("exports a valid config with routes array", () => {
    expect(middlewareConfig).toBeDefined();
    expect(middlewareConfig).toHaveProperty("routes");
    expect(Array.isArray(middlewareConfig.routes)).toBe(true);
  });

  it("has exactly 2 route definitions", () => {
    expect(middlewareConfig.routes).toHaveLength(2);
  });

  it("first route matches /store/*", () => {
    const storeRoute = middlewareConfig.routes[0];
    expect(storeRoute.matcher).toBe("/store/*");
    expect(Array.isArray(storeRoute.middlewares)).toBe(true);
    expect(storeRoute.middlewares).toHaveLength(1);
  });

  it("second route matches /*", () => {
    const globalRoute = middlewareConfig.routes[1];
    expect(globalRoute.matcher).toBe("/*");
    expect(Array.isArray(globalRoute.middlewares)).toBe(true);
    expect(globalRoute.middlewares).toHaveLength(1);
  });

  it("middleware functions are callable", () => {
    for (const route of middlewareConfig.routes) {
      for (const mw of route.middlewares) {
        expect(typeof mw).toBe("function");
      }
    }
  });

  describe("store request-id middleware", () => {
    const storeMiddleware = middlewareConfig.routes[0].middlewares[0] as MiddlewareFn;

    it("sets x-request-id from header when provided", () => {
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

    it("generates a UUID when x-request-id header is not present", () => {
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

  describe("global CORS debug middleware", () => {
    const corsMiddleware = middlewareConfig.routes[1].middlewares[0] as MiddlewareFn;

    it("calls next() regardless of environment", () => {
      const req: MockReq = {
        headers: {},
        scope: { resolve: () => undefined },
        method: "GET",
        path: "/store/products",
      };
      const res: MockRes = {};
      const next = vi.fn();

      corsMiddleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("logs origin in non-production when origin header is present", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

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

      process.env.NODE_ENV = originalEnv;
    });

    it("does not log in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const debugFn = vi.fn();
      const req: MockReq = {
        headers: { origin: "https://veloura.com" },
        scope: { resolve: () => ({ debug: debugFn }) },
        method: "GET",
        path: "/store/products",
      };
      const res: MockRes = {};
      const next = vi.fn();

      corsMiddleware(req, res, next);

      expect(debugFn).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
