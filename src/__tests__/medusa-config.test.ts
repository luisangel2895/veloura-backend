import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We test medusa-config.ts BY ACTUALLY IMPORTING IT (not by re-implementing
// the env-handling logic in this file, which is what the previous version
// of this test did and made the tests decorative). To do that we have to
// stub the Medusa side-effects (loadEnv + defineConfig) before each
// dynamic import, then re-import on a fresh module registry every time.

vi.mock("@medusajs/framework/utils", () => ({
  // loadEnv is a no-op in tests — we control process.env directly.
  loadEnv: vi.fn(),
  // defineConfig just echoes its input back so we can inspect what
  // medusa-config.ts produced.
  defineConfig: vi.fn((config: unknown) => config),
}));

type ConfigShape = {
  projectConfig: {
    databaseUrl: string;
    databaseLogging: boolean;
    redisUrl?: string;
    workerMode: string;
    http: {
      storeCors: string;
      adminCors: string;
      authCors: string;
      jwtSecret: string;
      cookieSecret: string;
      jwtExpiresIn: string;
    };
    cookieOptions: {
      secure: boolean;
      sameSite: "none" | "lax";
      httpOnly: boolean;
    };
  };
  admin: { backendUrl: string; path: string };
  modules: Array<Record<string, unknown>>;
};

async function loadConfig(): Promise<ConfigShape> {
  vi.resetModules();
  // Re-import inside the test so each test sees a fresh evaluation
  // against the current process.env state. The `.js` extension is
  // required by NodeNext module resolution even though the source is
  // a TypeScript file.
  const mod = await import("../../medusa-config.js");
  return mod.default as unknown as ConfigShape;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Reset the env to a known minimal baseline before each test.
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, {
    DATABASE_URL: "postgres://test@localhost:5432/test",
    NODE_ENV: "development",
  });
});

afterEach(() => {
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
});

describe("medusa-config.ts (real module)", () => {
  describe("DATABASE_URL handling", () => {
    it("falls back to empty string when DATABASE_URL is missing (build-time tolerance)", async () => {
      // medusa-config is evaluated by `medusa build` which has no DB
      // connection, so the module must NOT throw on a missing DATABASE_URL.
      // Runtime validation happens later, inside Medusa's connection layer.
      delete process.env.DATABASE_URL;
      const cfg = await loadConfig();
      expect(cfg.projectConfig.databaseUrl).toBe("");
    });

    it("uses DATABASE_URL when provided", async () => {
      process.env.DATABASE_URL = "postgres://x@y:5432/z";
      const cfg = await loadConfig();
      expect(cfg.projectConfig.databaseUrl).toBe("postgres://x@y:5432/z");
    });
  });

  describe("databaseLogging from env", () => {
    it("defaults to false", async () => {
      const cfg = await loadConfig();
      expect(cfg.projectConfig.databaseLogging).toBe(false);
    });

    it("turns on when DATABASE_LOGGING=true", async () => {
      process.env.DATABASE_LOGGING = "true";
      const cfg = await loadConfig();
      expect(cfg.projectConfig.databaseLogging).toBe(true);
    });
  });

  describe("JWT_SECRET / COOKIE_SECRET production gating", () => {
    it("throws in production when JWT_SECRET is missing", async () => {
      process.env.NODE_ENV = "production";
      await expect(loadConfig()).rejects.toThrow(/JWT_SECRET is required in production/);
    });

    it("throws in production when COOKIE_SECRET is missing", async () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "x".repeat(32);
      await expect(loadConfig()).rejects.toThrow(/COOKIE_SECRET is required in production/);
    });

    it("uses dev fallbacks in development", async () => {
      const cfg = await loadConfig();
      expect(cfg.projectConfig.http.jwtSecret).toBe("supersecret");
      expect(cfg.projectConfig.http.cookieSecret).toBe("supersecret");
    });
  });

  describe("JWT_EXPIRES_IN", () => {
    it("defaults to 1h", async () => {
      const cfg = await loadConfig();
      expect(cfg.projectConfig.http.jwtExpiresIn).toBe("1h");
    });

    it("respects override", async () => {
      process.env.JWT_EXPIRES_IN = "30m";
      const cfg = await loadConfig();
      expect(cfg.projectConfig.http.jwtExpiresIn).toBe("30m");
    });
  });

  describe("CORS defaults", () => {
    it("falls back to localhost values", async () => {
      const cfg = await loadConfig();
      expect(cfg.projectConfig.http.storeCors).toBe("http://localhost:3000");
      expect(cfg.projectConfig.http.adminCors).toBe("http://localhost:9000");
      expect(cfg.projectConfig.http.authCors).toBe("http://localhost:3000,http://localhost:9000");
    });

    it("respects custom CORS env vars", async () => {
      process.env.STORE_CORS = "https://store.veloura.com";
      process.env.ADMIN_CORS = "https://admin.veloura.com";
      process.env.AUTH_CORS = "https://auth.veloura.com";
      const cfg = await loadConfig();
      expect(cfg.projectConfig.http.storeCors).toBe("https://store.veloura.com");
      expect(cfg.projectConfig.http.adminCors).toBe("https://admin.veloura.com");
      expect(cfg.projectConfig.http.authCors).toBe("https://auth.veloura.com");
    });
  });

  describe("Redis modules with separate logical DBs", () => {
    it("does not load Redis modules when REDIS_URL is not set", async () => {
      const cfg = await loadConfig();
      const redisModules = cfg.modules.filter((m) => String(m.resolve).includes("redis"));
      expect(redisModules).toHaveLength(0);
    });

    it("loads three Redis modules with /0, /1, /2 namespaces", async () => {
      process.env.REDIS_URL = "redis://redis:6379";
      const cfg = await loadConfig();
      const redisModules = cfg.modules.filter((m) => String(m.resolve).includes("redis"));
      expect(redisModules).toHaveLength(3);

      // Verify each module uses a different Redis DB number.
      const eventBus = redisModules.find((m) => String(m.resolve).includes("event-bus"));
      const cache = redisModules.find((m) => String(m.resolve).includes("cache"));
      const workflow = redisModules.find((m) => String(m.resolve).includes("workflow"));
      expect(eventBus).toBeDefined();
      expect(cache).toBeDefined();
      expect(workflow).toBeDefined();

      const eventOpts = (eventBus!.options as { redisUrl: string }).redisUrl;
      const cacheOpts = (cache!.options as { redisUrl: string }).redisUrl;
      const workflowOpts = (workflow!.options as { redis: { url: string } }).redis.url;

      expect(eventOpts).toBe("redis://redis:6379/1");
      expect(cacheOpts).toBe("redis://redis:6379/0");
      expect(workflowOpts).toBe("redis://redis:6379/2");
    });
  });

  describe("Stripe module gating", () => {
    it("does not load Stripe when STRIPE_API_KEY is unset", async () => {
      const cfg = await loadConfig();
      const payment = cfg.modules.find((m) => String(m.resolve).includes("payment"));
      expect(payment).toBeUndefined();
    });

    it("loads Stripe in dev with key but no webhook secret", async () => {
      process.env.STRIPE_API_KEY = "sk_test_x";
      const cfg = await loadConfig();
      const payment = cfg.modules.find((m) => String(m.resolve).includes("payment"));
      expect(payment).toBeDefined();
    });

    it("throws in production when STRIPE_API_KEY is set but webhook secret is missing", async () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "x".repeat(32);
      process.env.COOKIE_SECRET = "y".repeat(32);
      process.env.STRIPE_API_KEY = "sk_live_x";
      // STRIPE_WEBHOOK_SECRET intentionally omitted.
      await expect(loadConfig()).rejects.toThrow(/STRIPE_WEBHOOK_SECRET is required/);
    });

    it("loads Stripe in production when both vars are set", async () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "x".repeat(32);
      process.env.COOKIE_SECRET = "y".repeat(32);
      process.env.STRIPE_API_KEY = "sk_live_x";
      process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
      const cfg = await loadConfig();
      const payment = cfg.modules.find((m) => String(m.resolve).includes("payment"));
      expect(payment).toBeDefined();
    });
  });

  describe("file storage provider", () => {
    it("uses file-local when S3_BUCKET is not set", async () => {
      const cfg = await loadConfig();
      const fileMod = cfg.modules.find((m) => String(m.resolve).endsWith("/file"));
      expect(fileMod).toBeDefined();
      const providers = (fileMod!.options as { providers: Array<{ resolve: string }> }).providers;
      expect(providers[0].resolve).toContain("file-local");
    });

    it("uses file-s3 when S3_BUCKET is set", async () => {
      process.env.S3_BUCKET = "medusa-media";
      process.env.S3_ENDPOINT = "http://minio:9000";
      process.env.S3_ACCESS_KEY_ID = "x";
      process.env.S3_SECRET_ACCESS_KEY = "y";
      const cfg = await loadConfig();
      const fileMod = cfg.modules.find((m) => String(m.resolve).endsWith("/file"));
      expect(fileMod).toBeDefined();
      const providers = (fileMod!.options as { providers: Array<{ resolve: string }> }).providers;
      expect(providers[0].resolve).toContain("file-s3");
    });
  });

  describe("admin path and backend URL", () => {
    it("admin path is /veloura", async () => {
      const cfg = await loadConfig();
      expect(cfg.admin.path).toBe("/veloura");
    });

    it("backendUrl defaults to localhost:9000", async () => {
      const cfg = await loadConfig();
      expect(cfg.admin.backendUrl).toBe("http://localhost:9000");
    });

    it("backendUrl respects MEDUSA_BACKEND_URL", async () => {
      process.env.MEDUSA_BACKEND_URL = "https://api.veloura.com";
      const cfg = await loadConfig();
      expect(cfg.admin.backendUrl).toBe("https://api.veloura.com");
    });
  });

  describe("cookie options", () => {
    it("defaults to lax + insecure", async () => {
      const cfg = await loadConfig();
      expect(cfg.projectConfig.cookieOptions.sameSite).toBe("lax");
      expect(cfg.projectConfig.cookieOptions.secure).toBe(false);
      expect(cfg.projectConfig.cookieOptions.httpOnly).toBe(true);
    });

    it("switches to none + secure when COOKIE_SECURE=true", async () => {
      process.env.COOKIE_SECURE = "true";
      const cfg = await loadConfig();
      expect(cfg.projectConfig.cookieOptions.sameSite).toBe("none");
      expect(cfg.projectConfig.cookieOptions.secure).toBe(true);
    });
  });
});
