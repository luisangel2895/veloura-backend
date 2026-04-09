import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const isProduction = process.env.NODE_ENV === "production";

// ── Helpers ──────────────────────────────────────────────────────

function requiredInProduction(name: string, devFallback: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction) {
      throw new Error(`${name} is required in production`);
    }
    return devFallback;
  }
  return value;
}

// ── Config values ────────────────────────────────────────────────

// DATABASE_URL is intentionally NOT validated at module load time —
// `medusa build` evaluates this file without a database connection
// (and would crash if we threw here). At runtime, Medusa surfaces a
// clearer error if the URL is missing or invalid.
const databaseUrl = process.env.DATABASE_URL ?? "";
const databaseLogging = process.env.DATABASE_LOGGING === "true";
const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const storeCors = process.env.STORE_CORS || "http://localhost:3000";
const adminCors = process.env.ADMIN_CORS || "http://localhost:9000";
const authCors = process.env.AUTH_CORS || `${storeCors},${adminCors}`;
const useSecureCookies = process.env.COOKIE_SECURE === "true";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";

// Redis: separate logical DBs for cache, event bus and workflow engine.
// Sharing db=0 means key namespaces collide and one module can interfere
// with another (especially relevant when noeviction is set on a small box).
const redisUrl = process.env.REDIS_URL;
const redisCacheUrl = redisUrl ? `${redisUrl}/0` : undefined;
const redisEventUrl = redisUrl ? `${redisUrl}/1` : undefined;
const redisWorkflowUrl = redisUrl ? `${redisUrl}/2` : undefined;

const modules: Record<string, unknown>[] = [];

// ── File storage: S3 (MinIO in prod) with file-local fallback for dev ─
if (process.env.S3_BUCKET) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || "us-east-1",
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            additional_client_config: { forcePathStyle: true },
          },
        },
      ],
    },
  });
} else {
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
}

// ── Payment: Stripe ──────────────────────────────────────────────
// In production with a LIVE Stripe key we REQUIRE the webhook secret —
// without it, Medusa silently skips signature validation and an
// attacker can forge "payment_intent.succeeded" events to mark orders
// as paid. With a TEST key we only warn (test webhooks are still
// signature-checked but the impact of forgery is limited to test mode).
if (process.env.STRIPE_API_KEY) {
  const isLiveKey = process.env.STRIPE_API_KEY.startsWith("sk_live_");
  if (isProduction && isLiveKey && !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is required in production when STRIPE_API_KEY " +
        "is a LIVE key. Without it, webhook signature validation is skipped " +
        "and payment events can be forged.",
    );
  }
  if (isProduction && !isLiveKey && !process.env.STRIPE_WEBHOOK_SECRET) {
    // eslint-disable-next-line no-console
    console.warn(
      "[medusa-config] STRIPE_API_KEY is set (test mode) but " +
        "STRIPE_WEBHOOK_SECRET is empty. Webhook signature validation " +
        "is OFF — set STRIPE_WEBHOOK_SECRET before going to live keys.",
    );
  }
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
      options: { redisUrl: redisEventUrl },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: redisCacheUrl },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { url: redisWorkflowUrl } },
    },
  );
}

export default defineConfig({
  projectConfig: {
    databaseUrl,
    databaseLogging,
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
      jwtSecret: requiredInProduction("JWT_SECRET", "supersecret"),
      cookieSecret: requiredInProduction("COOKIE_SECRET", "supersecret"),
      jwtExpiresIn,
      compression: {
        enabled: true,
        level: 6,
        threshold: 1024,
      },
    },
    cookieOptions: {
      secure: useSecureCookies,
      sameSite: useSecureCookies ? ("none" as const) : ("lax" as const),
      httpOnly: true,
    },
  },
  admin: {
    backendUrl,
    path: "/veloura",
  },
  modules,
});
