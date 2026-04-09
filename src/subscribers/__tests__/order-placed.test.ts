import { describe, it, expect, vi } from "vitest";

vi.mock("@medusajs/framework/utils", () => ({
  ContainerRegistrationKeys: {
    LOGGER: "logger",
  },
  Modules: {
    ORDER: "order",
  },
}));

import orderPlacedHandler, { config } from "../../subscribers/order-placed.js";

interface MockLogger {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}

interface MockOrderModule {
  retrieveOrder: ReturnType<typeof vi.fn>;
}

interface MockContainer {
  resolve: (key: string) => MockLogger | MockOrderModule | undefined;
}

interface MockEvent {
  data: { id: string };
  name: string;
}

interface MockSubscriberArgs {
  event: MockEvent;
  container: MockContainer;
}

function buildContainer(opts: {
  logger: MockLogger;
  orderModule?: MockOrderModule | null;
}): MockContainer {
  return {
    resolve: (key: string) => {
      if (key === "logger") return opts.logger;
      if (key === "order") return opts.orderModule ?? undefined;
      return undefined;
    },
  };
}

describe("order-placed subscriber", () => {
  describe("config", () => {
    it("listens to the 'order.placed' event", () => {
      expect(config.event).toBe("order.placed");
    });
  });

  describe("handler", () => {
    it("hydrates the order and logs id+email+total when retrieveOrder succeeds", async () => {
      const logger: MockLogger = { info: vi.fn(), error: vi.fn() };
      const orderModule: MockOrderModule = {
        retrieveOrder: vi.fn().mockResolvedValue({
          id: "order_test_123",
          email: "buyer@example.com",
          total: 12345,
          currency_code: "usd",
        }),
      };
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_test_123" }, name: "order.placed" },
        container: buildContainer({ logger, orderModule }),
      };

      await orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]);

      expect(orderModule.retrieveOrder).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledOnce();
      const message = logger.info.mock.calls[0][0] as string;
      expect(message).toContain("order_test_123");
      expect(message).toContain("buyer@example.com");
      expect(message).toContain("12345");
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("falls back to a minimal log line when retrieveOrder fails", async () => {
      const logger: MockLogger = { info: vi.fn(), error: vi.fn() };
      const orderModule: MockOrderModule = {
        retrieveOrder: vi.fn().mockRejectedValue(new Error("not found")),
      };
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_456" }, name: "order.placed" },
        container: buildContainer({ logger, orderModule }),
      };

      await orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]);

      expect(logger.info).toHaveBeenCalledOnce();
      const message = logger.info.mock.calls[0][0] as string;
      expect(message).toContain("order_456");
      expect(message).toContain("could not hydrate");
    });

    it("never throws even if the logger itself fails", async () => {
      const logger: MockLogger = {
        info: vi.fn().mockImplementation(() => {
          throw new Error("logger broken");
        }),
        error: vi.fn(),
      };
      const orderModule: MockOrderModule = {
        retrieveOrder: vi.fn().mockResolvedValue({
          id: "order_err_789",
          email: null,
          total: 0,
          currency_code: "usd",
        }),
      };
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_err_789" }, name: "order.placed" },
        container: buildContainer({ logger, orderModule }),
      };

      await expect(
        orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledOnce();
      const errMessage = logger.error.mock.calls[0][0] as string;
      expect(errMessage).toContain("order_err_789");
      expect(errMessage).toContain("logger broken");
    });
  });
});
