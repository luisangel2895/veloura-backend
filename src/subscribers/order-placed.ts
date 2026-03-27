import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function orderPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderId = event.data.id;

  logger.info(`[Veloura] Order placed: ${orderId}`);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
