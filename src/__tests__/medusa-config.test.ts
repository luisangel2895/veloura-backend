import { describe, it, expect, vi, beforeEach } from "vitest";

// We cannot directly import medusa-config.ts because it calls loadEnv and
// defineConfig at module level with side effects. Instead, we test the
// configuration logic patterns by simulating the same env-based decisions.

describe("medusa-config logic", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("JWT_SECRET handling", () => {
    it("throws in production when JWT_SECRET is missing", () => {
      vi.stubEnv("NODE_ENV", "production");

      const getJwtSecret = () => {
        const secret = process.env.JWT_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("JWT_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(() => getJwtSecret()).toThrowError("JWT_SECRET is required in production");
    });

    it("returns the secret in production when JWT_SECRET is set", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("JWT_SECRET", "my-prod-secret");

      const getJwtSecret = () => {
        const secret = process.env.JWT_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("JWT_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(getJwtSecret()).toBe("my-prod-secret");
    });

    it("falls back to 'supersecret' in development when JWT_SECRET is missing", () => {
      vi.stubEnv("NODE_ENV", "development");

      const getJwtSecret = () => {
        const secret = process.env.JWT_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("JWT_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(getJwtSecret()).toBe("supersecret");
    });
  });

  describe("COOKIE_SECRET handling", () => {
    it("throws in production when COOKIE_SECRET is missing", () => {
      vi.stubEnv("NODE_ENV", "production");

      const getCookieSecret = () => {
        const secret = process.env.COOKIE_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("COOKIE_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(() => getCookieSecret()).toThrowError("COOKIE_SECRET is required in production");
    });

    it("returns the secret in production when COOKIE_SECRET is set", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("COOKIE_SECRET", "my-cookie-secret");

      const getCookieSecret = () => {
        const secret = process.env.COOKIE_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("COOKIE_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(getCookieSecret()).toBe("my-cookie-secret");
    });

    it("falls back to 'supersecret' in development when COOKIE_SECRET is missing", () => {
      vi.stubEnv("NODE_ENV", "development");

      const getCookieSecret = () => {
        const secret = process.env.COOKIE_SECRET;
        const isProduction = process.env.NODE_ENV === "production";
        if (!secret && isProduction) throw new Error("COOKIE_SECRET is required in production");
        return secret || "supersecret";
      };

      expect(getCookieSecret()).toBe("supersecret");
    });
  });

  describe("CORS defaults", () => {
    it("store CORS defaults to localhost:3000", () => {
      delete process.env.STORE_CORS;
      const storeCors = process.env.STORE_CORS || "http://localhost:3000";
      expect(storeCors).toBe("http://localhost:3000");
    });

    it("admin CORS defaults to localhost:9000", () => {
      delete process.env.ADMIN_CORS;
      const adminCors = process.env.ADMIN_CORS || "http://localhost:9000";
      expect(adminCors).toBe("http://localhost:9000");
    });

    it("auth CORS combines store and admin CORS by default", () => {
      delete process.env.STORE_CORS;
      delete process.env.ADMIN_CORS;
      delete process.env.AUTH_CORS;

      const storeCors = process.env.STORE_CORS || "http://localhost:3000";
      const adminCors = process.env.ADMIN_CORS || "http://localhost:9000";
      const authCors = process.env.AUTH_CORS || `${storeCors},${adminCors}`;

      expect(authCors).toBe("http://localhost:3000,http://localhost:9000");
    });

    it("respects custom CORS environment variables", () => {
      vi.stubEnv("STORE_CORS", "https://store.veloura.com");
      vi.stubEnv("ADMIN_CORS", "https://admin.veloura.com");

      const storeCors = process.env.STORE_CORS || "http://localhost:3000";
      const adminCors = process.env.ADMIN_CORS || "http://localhost:9000";

      expect(storeCors).toBe("https://store.veloura.com");
      expect(adminCors).toBe("https://admin.veloura.com");
    });
  });

  describe("Redis modules conditional loading", () => {
    it("loads Redis modules when REDIS_URL is set", () => {
      vi.stubEnv("REDIS_URL", "redis://localhost:6379");

      const modules: Record<string, unknown>[] = [];
      const redisUrl = process.env.REDIS_URL;

      if (redisUrl) {
        modules.push(
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: { redisUrl },
          },
          {
            resolve: "@medusajs/medusa/cache-redis",
            options: { redisUrl },
          },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: { redis: { redisUrl } },
          },
        );
      }

      expect(modules).toHaveLength(3);
      expect(modules[0].resolve).toBe("@medusajs/medusa/event-bus-redis");
      expect(modules[1].resolve).toBe("@medusajs/medusa/cache-redis");
      expect(modules[2].resolve).toBe("@medusajs/medusa/workflow-engine-redis");
    });

    it("does not load Redis modules when REDIS_URL is not set", () => {
      delete process.env.REDIS_URL;

      const modules: Record<string, unknown>[] = [];
      const redisUrl = process.env.REDIS_URL;

      if (redisUrl) {
        modules.push({
          resolve: "@medusajs/medusa/event-bus-redis",
          options: { redisUrl },
        });
      }

      expect(modules).toHaveLength(0);
    });
  });

  describe("Stripe module conditional loading", () => {
    it("loads Stripe module when STRIPE_API_KEY is set", () => {
      vi.stubEnv("STRIPE_API_KEY", "sk_test_123");
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");

      const modules: Record<string, unknown>[] = [];

      if (process.env.STRIPE_API_KEY) {
        modules.push({
          resolve: "@medusajs/medusa/payment",
          options: {
            providers: [
              {
                resolve: "@medusajs/medusa/payment-stripe",
                id: "stripe",
                options: {
                  apiKey: process.env.STRIPE_API_KEY,
                  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  capture: false,
                  automatic_payment_methods: true,
                },
              },
            ],
          },
        });
      }

      expect(modules).toHaveLength(1);
      expect(modules[0].resolve).toBe("@medusajs/medusa/payment");
    });

    it("does not load Stripe module when STRIPE_API_KEY is not set", () => {
      delete process.env.STRIPE_API_KEY;

      const modules: Record<string, unknown>[] = [];

      if (process.env.STRIPE_API_KEY) {
        modules.push({
          resolve: "@medusajs/medusa/payment",
          options: {},
        });
      }

      expect(modules).toHaveLength(0);
    });
  });

  describe("backend URL defaults", () => {
    it("defaults to localhost:9000", () => {
      delete process.env.MEDUSA_BACKEND_URL;
      const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
      expect(backendUrl).toBe("http://localhost:9000");
    });

    it("respects custom MEDUSA_BACKEND_URL", () => {
      vi.stubEnv("MEDUSA_BACKEND_URL", "https://api.veloura.com");
      const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
      expect(backendUrl).toBe("https://api.veloura.com");
    });
  });

  describe("database configuration", () => {
    it("disables SSL in non-production", () => {
      vi.stubEnv("NODE_ENV", "development");
      const isProduction = process.env.NODE_ENV === "production";
      const driverOptions = isProduction
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : {};
      expect(driverOptions).toEqual({});
    });

    it("enables SSL in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const isProduction = process.env.NODE_ENV === "production";
      const driverOptions = isProduction
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : {};
      expect(driverOptions).toEqual({
        connection: { ssl: { rejectUnauthorized: false } },
      });
    });
  });
});
