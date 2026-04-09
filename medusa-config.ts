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
