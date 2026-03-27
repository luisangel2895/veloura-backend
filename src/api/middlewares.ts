import { defineMiddlewares } from "@medusajs/medusa";
import { randomUUID } from "crypto";
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/*",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const requestId = (req.headers["x-request-id"] as string) || randomUUID();
          res.setHeader("x-request-id", requestId);
          (req as MedusaRequest & { requestId: string }).requestId = requestId;
          next();
        },
      ],
    },
    {
      matcher: "/*",
      middlewares: [
        (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
          if (process.env.NODE_ENV !== "production") {
            const origin = req.headers.origin;
            if (origin) {
              req.scope
                .resolve("logger")
                ?.debug(`[CORS] ${req.method} ${req.path} from origin: ${origin}`);
            }
          }
          next();
        },
      ],
    },
  ],
});
