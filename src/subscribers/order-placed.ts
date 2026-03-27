import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderId = event.data.id;

  try {
    logger.info(
      `[Veloura] Order placed: ${orderId} at ${new Date().toISOString()}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      `[Veloura] Failed to process order.placed event for ${orderId}: ${message}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
