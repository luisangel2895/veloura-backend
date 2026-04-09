import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Handler for `order.placed` events.
 *
 * Currently this only logs structured information about the placed order.
 * It is the integration point for the following follow-ups (TODO):
 *  - Send order confirmation email to the customer
 *  - Notify ops/Slack channel of new order
 *  - Reserve inventory at the warehouse
 *  - Trigger fraud-check workflow
 *
 * Errors are caught and logged so a failure here never blocks the
 * downstream event bus from acknowledging the message. Medusa retries
 * are handled at the workflow engine level when needed.
 */
export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderId = event.data.id;

  try {
    // Hydrate a small projection of the order so the log line is useful
    // for grepping (id, total, currency, customer email).
    const orderModule = container.resolve(Modules.ORDER);
    const order = await orderModule
      .retrieveOrder(orderId, { select: ["id", "email", "total", "currency_code"] })
      .catch(() => null);

    if (order) {
      logger.info(
        `[Veloura] order.placed id=${order.id} email=${order.email ?? "-"} total=${order.total ?? 0} ${order.currency_code ?? "-"}`,
      );
    } else {
      logger.info(`[Veloura] order.placed id=${orderId} (could not hydrate order details)`);
    }

    // TODO(orders): trigger downstream workflows (email, slack, fraud, etc).
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Never throw out of a subscriber — it would cause the event bus to
    // retry indefinitely on a permanent error. Log and continue.
    try {
      logger.error(`[Veloura] order.placed handler failed for ${orderId}: ${message}`);
    } catch {
      // logger itself failed — give up silently.
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
