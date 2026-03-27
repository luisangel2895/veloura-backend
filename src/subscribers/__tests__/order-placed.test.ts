import { describe, it, expect, vi } from "vitest";

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
      expect(infoFn).toHaveBeenCalledWith(
        expect.stringContaining("order_test_123")
      );
      expect(errorFn).not.toHaveBeenCalled();
    });

    it("logs with ISO timestamp in the message", async () => {
      const infoFn = vi.fn();
      const args: MockSubscriberArgs = {
        event: { data: { id: "order_456" }, name: "order.placed" },
        container: { resolve: () => ({ info: infoFn, error: vi.fn() }) },
      };

      await orderPlacedHandler(args as Parameters<typeof orderPlacedHandler>[0]);

      const logMessage = infoFn.mock.calls[0][0] as string;
      expect(logMessage).toContain("order_456");
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}T/);
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
        expect.stringContaining("order_err_789")
      );
      expect(errorFn).toHaveBeenCalledWith(
        expect.stringContaining("Logger failed")
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
        expect.stringContaining("string error")
      );
    });
  });
});
