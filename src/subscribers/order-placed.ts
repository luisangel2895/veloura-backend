import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderId = event.data.id;

  try {
    logger.info(`[Veloura] Order placed`, {
      orderId,
      timestamp: new Date().toISOString(),
      eventName: event.name,
    });
  } catch (error) {
    logger.error(`[Veloura] Failed to process order.placed event`, {
      orderId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
