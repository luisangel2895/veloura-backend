import { describe, it, expect, vi } from "vitest";

// Mock the Medusa framework utils
vi.mock("@medusajs/framework/utils", () => ({
  ContainerRegistrationKeys: {
    LOGGER: "logger",
  },
}));

import orderPlacedHandler, {
  config,
} from "../../subscribers/order-placed";

interface MockLogger {
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
}

interface MockContainer {
  resolve: (key: string) => MockLogger | undefined;
}

interface MockEvent {
  data: { id: string };
  name: string;
}

interface MockSubscriberArgs {
  event: MockEvent;
  container: MockContainer;
}

describe("order-placed subscriber", () => {
  describe("config", () => {
    it("listens to the 'order.placed' event", () => {
      expect(config.event).toBe("order.placed");
    });
  });

  describe("handler", () => {
    it("logs the order ID when called", async () => {
      const infoFn = vi.fn();
      const errorFn = vi.fn();
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_test_123" }, name: "order.placed" },
        container: {
          resolve: (key: string) =>
            key === "logger" ? { info: infoFn, error: errorFn } : undefined,
        },
      };

      await orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]);

      expect(infoFn).toHaveBeenCalledOnce();
      expect(infoFn).toHaveBeenCalledWith("[Veloura] Order placed", {
        orderId: "order_test_123",
        timestamp: expect.any(String),
        eventName: "order.placed",
      });
      expect(errorFn).not.toHaveBeenCalled();
    });

    it("logs with ISO timestamp format", async () => {
      const infoFn = vi.fn();
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_456" }, name: "order.placed" },
        container: { resolve: () => ({ info: infoFn, error: vi.fn() }) },
      };

      await orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]);

      const callArgs = infoFn.mock.calls[0][1] as { timestamp: string };
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(new Date(callArgs.timestamp).toISOString()).toBe(callArgs.timestamp);
    });

    it("handles errors gracefully without throwing", async () => {
      const infoFn = vi.fn().mockImplementation(() => {
        throw new Error("Logger failed");
      });
      const errorFn = vi.fn();
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_err_789" }, name: "order.placed" },
        container: { resolve: () => ({ info: infoFn, error: errorFn }) },
      };

      await expect(
        orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0])
      ).resolves.toBeUndefined();

      expect(errorFn).toHaveBeenCalledOnce();
      expect(errorFn).toHaveBeenCalledWith(
        "[Veloura] Failed to process order.placed event",
        {
          orderId: "order_err_789",
          error: "Logger failed",
          stack: expect.any(String),
        }
      );
    });

    it("handles non-Error objects in catch block", async () => {
      const infoFn = vi.fn().mockImplementation(() => {
        throw "string error";
      });
      const errorFn = vi.fn();
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_str_err" }, name: "order.placed" },
        container: { resolve: () => ({ info: infoFn, error: errorFn }) },
      };

      await expect(
        orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0])
      ).resolves.toBeUndefined();

      expect(errorFn).toHaveBeenCalledWith(
        "[Veloura] Failed to process order.placed event",
        {
          orderId: "order_str_err",
          error: "string error",
          stack: undefined,
        }
      );
    });
  });
});
