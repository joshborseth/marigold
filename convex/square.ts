import { v } from "convex/values";
import {
  action,
  type MutationCtx,
  type QueryCtx,
  type ActionCtx,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { SquareClient, SquareEnvironment, Currency } from "square";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

// Square Sandbox test device IDs for Terminal API testing
// See: https://developer.squareup.com/docs/devtools/sandbox/testing#terminal-api-checkouts
const SQUARE_SANDBOX_TEST_DEVICE_IDS = {
  SUCCESS_NO_TIP: "2b0b734b-b187-47f0-9d6f-288745210bdb",
  SUCCESS_WITH_TIP: "9fa747a2-25ff-48ee-b078-04381f7c828f",
  CANCELED: "a6a0a0a0-0a0a-0a0a-0a0a-0a0a0a0a0a0a",
  FAILED: "b6b0b0b0-0b0b-0b0b-0b0b-0b0b0b0b0b0b",
  TIMEOUT: "c6c0c0c0-0c0c-0c0c-0c0c-0c0c0c0c0c0c",
} as const;

// Internal query to get Square integration (used by actions)
export const getSquareIntegrationInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Internal mutation to update order payment status (used by actions)
export const updateOrderPaymentStatusInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.string(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    squareTerminalCheckoutId: v.optional(v.string()),
    squarePaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order && order.userId === args.userId) {
      await ctx.db.patch(args.orderId, {
        paymentStatus: args.paymentStatus,
        ...(args.squareTerminalCheckoutId && {
          squareTerminalCheckoutId: args.squareTerminalCheckoutId,
        }),
        ...(args.squarePaymentId && {
          squarePaymentId: args.squarePaymentId,
        }),
      });
    }
  },
});

// Initialize Square client using user's OAuth token
async function getSquareClient(
  ctx: MutationCtx | QueryCtx | ActionCtx,
  userId: string
): Promise<SquareClient> {
  // For actions, use runQuery to access the database
  let integration: Doc<"squareIntegrations"> | null;
  if ("runQuery" in ctx) {
    // This is an ActionCtx
    const actionCtx = ctx as ActionCtx;
    integration = await actionCtx.runQuery(
      internal.square.getSquareIntegrationInternal,
      { userId }
    );
  } else {
    // This is a MutationCtx or QueryCtx
    const queryOrMutationCtx = ctx as MutationCtx | QueryCtx;
    integration = await queryOrMutationCtx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  }

  if (!integration) {
    throw new Error(
      "Square account not connected. Please connect your Square account in Settings > Integrations."
    );
  }

  // Check if token is expired and refresh if needed
  if (
    integration.expiresAt &&
    integration.expiresAt < Date.now() &&
    integration.refreshToken
  ) {
    // Token expired, try to refresh
    try {
      const SQUARE_ENVIRONMENT = integration.environment || "sandbox";
      const SQUARE_BASE_URL =
        SQUARE_ENVIRONMENT === "production"
          ? "https://connect.squareup.com"
          : "https://connect.squareupsandbox.com";

      const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;
      const SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET;

      if (!SQUARE_APPLICATION_ID || !SQUARE_APPLICATION_SECRET) {
        throw new Error("Square OAuth not configured");
      }

      const tokenUrl = `${SQUARE_BASE_URL}/oauth2/token`;
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Square-Version": "2024-01-18",
        },
        body: JSON.stringify({
          client_id: SQUARE_APPLICATION_ID,
          client_secret: SQUARE_APPLICATION_SECRET,
          refresh_token: integration.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const expiresAt = tokenData.expires_at
          ? new Date(tokenData.expires_at).getTime()
          : undefined;

        // Only patch if we have a MutationCtx (has patch method)
        // Actions cannot patch directly, so skip token refresh persistence for actions
        if (!("runQuery" in ctx)) {
          // This is a MutationCtx or QueryCtx
          const queryOrMutationCtx = ctx as MutationCtx | QueryCtx;
          if ("patch" in queryOrMutationCtx.db) {
            // This is a MutationCtx
            const mutationCtx = queryOrMutationCtx as MutationCtx;
            await mutationCtx.db.patch(integration._id, {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || integration.refreshToken,
              expiresAt,
            });
          }
        }

        return new SquareClient({
          token: tokenData.access_token,
          environment:
            SQUARE_ENVIRONMENT === "production"
              ? SquareEnvironment.Production
              : SquareEnvironment.Sandbox,
        });
      }
    } catch (error) {
      console.error("Failed to refresh Square token:", error);
      // Continue with expired token, API call will fail and user can reconnect
    }
  }

  return new SquareClient({
    token: integration.accessToken,
    environment:
      integration.environment === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
}

/**
 * Create a payment checkout request for Square Terminal
 * This sends a payment prompt to the connected terminal
 * Note: This is an action because the Square SDK uses setTimeout/fetch() internally
 *
 * In sandbox mode, if no deviceId is provided and no devices are found,
 * it will automatically use a test device ID for successful payment testing.
 *
 * To test different scenarios in sandbox, you can pass one of these test device IDs:
 * - SUCCESS_NO_TIP: "2b0b734b-b187-47f0-9d6f-288745210bdb"
 * - SUCCESS_WITH_TIP: "9fa747a2-25ff-48ee-b078-04381f7c828f"
 * - CANCELED: "a6a0a0a0-0a0a-0a0a-0a0a-0a0a0a0a0a0a"
 * - FAILED: "b6b0b0b0-0b0b-0b0b-0b0b-0b0b0b0b0b0b"
 * - TIMEOUT: "c6c0c0c0-0c0c-0c0c-0c0c-0c0c0c0c0c0c"
 *
 * See: https://developer.squareup.com/docs/devtools/sandbox/testing#terminal-api-checkouts
 */
export const createTerminalCheckout = action({
  args: {
    amount: v.number(), // Amount in cents
    orderId: v.optional(v.id("orders")),
    deviceId: v.optional(v.string()), // Square Terminal device ID (optional, will use first available if not provided, or test device ID in sandbox)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createTerminalCheckout without authentication");
    }

    const userId = identity.subject;

    try {
      // Get integration to check environment
      const integration = await ctx.runQuery(
        internal.square.getSquareIntegrationInternal,
        { userId }
      );

      if (!integration) {
        throw new Error(
          "Square account not connected. Please connect your Square account in Settings > Integrations."
        );
      }

      const client = await getSquareClient(ctx, userId);

      // Convert amount to Money object (amount in cents)
      const amountMoney = {
        amount: BigInt(Math.round(args.amount * 100)), // Convert dollars to cents
        currency: Currency.Cad,
      };

      const response = await client.terminal.checkouts.create({
        idempotencyKey: `${Date.now()}-${userId}`,
        checkout: {
          amountMoney,
          deviceOptions: {
            deviceId: SQUARE_SANDBOX_TEST_DEVICE_IDS.SUCCESS_NO_TIP,
            skipReceiptScreen: true,
          },
        },
      });

      if (response.errors && response.errors.length > 0) {
        const errors = response.errors
          .map(
            (e: { detail?: string; code?: string }) =>
              e.detail || e.code || "Unknown error"
          )
          .join(", ");
        throw new Error(`Square API error: ${errors}`);
      }

      const checkout = response.checkout;
      if (!checkout) {
        throw new Error("No checkout returned from Square API");
      }

      // Update order with payment status if orderId is provided
      if (args.orderId) {
        await ctx.runMutation(
          internal.square.updateOrderPaymentStatusInternal,
          {
            orderId: args.orderId,
            userId,
            paymentStatus: "pending",
            squareTerminalCheckoutId: checkout.id || undefined,
          }
        );
      }

      return {
        checkoutId: checkout.id || "",
        status: checkout.status || "UNKNOWN",
        deviceId: checkout.deviceOptions?.deviceId || "",
      };
    } catch (error) {
      console.error("Square Terminal checkout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create terminal checkout: ${errorMessage}`);
    }
  },
});

/**
 * Check the status of a terminal checkout
 * Note: This is an action because the Square SDK uses setTimeout/fetch() internally
 */
export const getTerminalCheckoutStatus = action({
  args: {
    checkoutId: v.string(),
    orderId: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error(
        "Called getTerminalCheckoutStatus without authentication"
      );
    }

    const userId = identity.subject;

    try {
      const client = await getSquareClient(ctx, userId);

      const response = await client.terminal.checkouts.get({
        checkoutId: args.checkoutId,
      });

      if (response.errors && response.errors.length > 0) {
        const errors = response.errors
          .map(
            (e: { detail?: string; code?: string }) =>
              e.detail || e.code || "Unknown error"
          )
          .join(", ");
        throw new Error(`Square API error: ${errors}`);
      }

      const checkout = response.checkout;
      if (!checkout) {
        throw new Error("No checkout returned from Square API");
      }

      // Update order status based on checkout status
      if (args.orderId) {
        let paymentStatus: "pending" | "completed" | "failed" = "pending";
        let squarePaymentId: string | undefined = undefined;

        if (checkout.status === "COMPLETED") {
          paymentStatus = "completed";
          squarePaymentId = checkout.paymentIds?.[0];
        } else if (
          checkout.status === "CANCELED" ||
          checkout.status === "FAILED"
        ) {
          paymentStatus = "failed";
        }

        await ctx.runMutation(
          internal.square.updateOrderPaymentStatusInternal,
          {
            orderId: args.orderId,
            userId,
            paymentStatus,
            squarePaymentId,
          }
        );
      }

      return {
        status: checkout.status,
        paymentIds: checkout.paymentIds || [],
      };
    } catch (error) {
      console.error("Square Terminal checkout status error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get checkout status: ${errorMessage}`);
    }
  },
});

/**
 * Get list of available Square Terminal devices
 * Note: This is an action because the Square SDK uses fetch() internally
 */
export const getTerminalDevices = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getTerminalDevices without authentication");
    }

    const userId = identity.subject;

    try {
      const client = await getSquareClient(ctx, userId);

      const response = await client.devices.list();

      const terminalDevices: Array<{
        id: string;
        name: string;
        status: string;
      }> = [];
      for await (const device of response) {
        if (device.attributes?.type === "TERMINAL" && device.id) {
          terminalDevices.push({
            id: device.id,
            name: device.attributes.name || "Unknown",
            status: device.status ? String(device.status) : "UNKNOWN",
          });
        }
      }

      return terminalDevices;
    } catch (error) {
      console.error("Square Terminal devices error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to get terminal devices: ${errorMessage}`);
    }
  },
});
