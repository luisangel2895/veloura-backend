import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isProduction = process.env.NODE_ENV === "production";

const backendUrl =
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const storeCors = process.env.STORE_CORS || "http://localhost:3000";
const adminCors = process.env.ADMIN_CORS || "http://localhost:9000";
const authCors = process.env.AUTH_CORS || `${storeCors},${adminCors}`;
const redisUrl = process.env.REDIS_URL;
const useSecureCookies = process.env.COOKIE_SECURE === "true";

const modules: Record<string, unknown>[] = [];

// ── File storage: use public backend URL for uploaded assets ─────
modules.push({
  resolve: "@medusajs/medusa/file",
  options: {
    providers: [
      {
        resolve: "@medusajs/medusa/file-local",
        id: "local",
        options: {
          backend_url: `${backendUrl}/static`,
        },
      },
    ],
  },
});

// ── Payment: Stripe ──────────────────────────────────────────────
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

// ── Production: Redis-backed infrastructure ──────────────────────
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

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL!,
    databaseLogging: false,
    databaseDriverOptions: process.env.DATABASE_SSL === "true"
      ? { connection: { ssl: { rejectUnauthorized: false } } }
      : {},
    redisUrl,
    workerMode:
      (process.env.WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors,
      adminCors,
      authCors,
      jwtSecret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret && isProduction) throw new Error("JWT_SECRET is required in production");
        return secret || "supersecret";
      })(),
      cookieSecret: (() => {
        const secret = process.env.COOKIE_SECRET;
        if (!secret && isProduction) throw new Error("COOKIE_SECRET is required in production");
        return secret || "supersecret";
      })(),
      jwtExpiresIn: "7d",
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024,
      },
    },
    cookieOptions: {
      secure: useSecureCookies,
      sameSite: useSecureCookies ? "none" as const : "lax" as const,
      httpOnly: true,
    },
  },
  admin: {
    backendUrl,
    path: "/veloura",
  },
  modules,
});
