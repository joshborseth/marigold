import { v } from "convex/values";
import {
  action,
  internalAction,
  internalQuery,
  internalMutation,
} from "../_generated/server";
import { SquareClient, Currency } from "square";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import {
  SQUARE_APPLICATION_ID,
  SQUARE_APPLICATION_SECRET,
  SQUARE_BASE_URL,
  SQUARE_ENVIRONMENT,
} from "./constants";
import { SQUARE_VERSION } from "./constants";

// Square Sandbox test device IDs for Terminal API testing
// See: https://developer.squareup.com/docs/devtools/sandbox/testing#terminal-api-checkouts
const SQUARE_SANDBOX_TEST_DEVICE_IDS = {
  SUCCESS_NO_TIP: "2b0b734b-b187-47f0-9d6f-288745210bdb",
  CANCELED: "a6a0a0a0-0a0a-0a0a-0a0a-0a0a0a0a0a0a",
  FAILED: "b6b0b0b0-0b0b-0b0b-0b0b-0b0b0b0b0b0b",
  TIMEOUT: "c6c0c0c0-0c0c-0c0c-0c0c-0c0c0c0c0c0c",
} as const;

export const getSquareIntegrationInternalOrThrow = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!integration) {
      throw new Error("Square account not connected.");
    }

    return integration;
  },
});

export const getSquareClient = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<SquareClient> => {
    const integration = await ctx.runQuery(
      internal.square.getSquareIntegrationInternalOrThrow,
      { userId: args.userId }
    );

    // Refresh token if expired
    if (isTokenExpired(integration)) {
      try {
        const refreshedClient = await refreshSquareToken(integration);
        if (refreshedClient) {
          return refreshedClient;
        }
      } catch (error) {
        console.error("Failed to refresh Square token:", error);
        // Continue with expired token - API call will fail and user can reconnect
      }
    }

    // Return client with existing token
    return new SquareClient({
      token: integration.accessToken,
      environment: SQUARE_BASE_URL,
    });
  },
});

export const updateOrderPaymentStatusInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
    userId: v.string(),
    squareTerminalCheckoutId: v.optional(v.string()),
    squarePaymentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order && order.userId === args.userId) {
      await ctx.db.patch(args.orderId, {
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

function isTokenExpired(integration: Doc<"squareIntegrations">): boolean {
  return (
    !!integration.expiresAt &&
    integration.expiresAt < Date.now() &&
    !!integration.refreshToken
  );
}

async function refreshSquareToken(
  integration: Doc<"squareIntegrations">
): Promise<SquareClient | null> {
  if (!integration.refreshToken) {
    return null;
  }

  const baseUrl = SQUARE_BASE_URL;
  const tokenUrl = `${baseUrl}/oauth2/token`;

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": SQUARE_VERSION,
    },
    body: JSON.stringify({
      client_id: SQUARE_APPLICATION_ID,
      client_secret: SQUARE_APPLICATION_SECRET,
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenData = await tokenResponse.json();

  return new SquareClient({
    token: tokenData.access_token,
    environment: SQUARE_BASE_URL,
  });
}

// Internal action that can be called from other actions
export const createTerminalCheckoutInternal = internalAction({
  args: {
    amount: v.number(), // Amount in cents
    orderId: v.optional(v.id("orders")),
    deviceId: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const deviceId =
      SQUARE_ENVIRONMENT === "production"
        ? args.deviceId
        : SQUARE_SANDBOX_TEST_DEVICE_IDS.SUCCESS_NO_TIP;

    if (SQUARE_ENVIRONMENT === "production" && !args.deviceId) {
      throw new Error("Device ID is required in production");
    }

    try {
      const client: SquareClient = await ctx.runAction(
        internal.square.getSquareClient,
        { userId: args.userId }
      );

      const amountMoney = {
        amount: BigInt(Math.round(args.amount)),
        currency: Currency.Cad,
      };

      const response = await client.terminal.checkouts.create({
        idempotencyKey: `${Date.now()}-${args.userId}`,
        checkout: {
          amountMoney,
          deviceOptions: {
            deviceId: deviceId!,
            skipReceiptScreen: true,
          },
        },
      });

      if (response.errors && response.errors.length > 0) {
        console.error("Square API error:", response.errors);
        throw new Error(
          "Failed to create terminal checkout. Please try again."
        );
      }

      const checkout = response.checkout;
      if (!checkout) {
        throw new Error(
          "No checkout returned from Square API. Please try again."
        );
      }

      if (args.orderId) {
        await ctx.runMutation(
          internal.square.updateOrderPaymentStatusInternal,
          {
            orderId: args.orderId,
            userId: args.userId,
            squareTerminalCheckoutId: checkout.id || undefined,
          }
        );
      }

      return {
        checkoutId: checkout.id,
      };
    } catch (error) {
      console.error("Square Terminal checkout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to create terminal checkout: ${errorMessage}`);
    }
  },
});

// Public action that can be called from the frontend
export const createTerminalCheckout = action({
  args: {
    amount: v.number(), // Amount in cents
    orderId: v.optional(v.id("orders")),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ checkoutId: string | undefined }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createTerminalCheckout without authentication");
    }

    const userId = identity.subject;

    return await ctx.runAction(internal.square.createTerminalCheckoutInternal, {
      amount: args.amount,
      orderId: args.orderId,
      deviceId: args.deviceId,
      userId,
    });
  },
});
