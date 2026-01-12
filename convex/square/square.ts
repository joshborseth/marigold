import { v } from "convex/values";
import {
  action,
  internalAction,
  internalQuery,
  internalMutation,
  query,
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

export const getSquareAccessToken = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<string> => {
    const integration = await ctx.runQuery(
      internal.square.square.getSquareIntegrationInternalOrThrow,
      { userId: args.userId }
    );

    // Refresh token if expired
    if (isTokenExpired(integration)) {
      try {
        const refreshedToken = await refreshSquareToken(integration);
        if (refreshedToken) {
          return refreshedToken;
        }
      } catch (error) {
        console.error("Failed to refresh Square token:", error);
        // Continue with expired token - API call will fail and user can reconnect
      }
    }

    // Return existing token
    return integration.accessToken;
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
): Promise<string | null> {
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

  return tokenData.access_token;
}

export const createTerminalCheckout = internalMutation({
  args: {
    checkoutId: v.string(),
    userId: v.string(),
    amountInCents: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("squareTerminalCheckouts", {
      checkoutId: args.checkoutId,
      userId: args.userId,
      status: "PENDING",
      amountInCents: args.amountInCents,
      createdAt: Date.now(),
    });
  },
});

export const getCheckoutStatus = query({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const checkout = await ctx.db
      .query("squareTerminalCheckouts")
      .withIndex("by_checkout_id", (q) => q.eq("checkoutId", args.checkoutId))
      .first();

    if (!checkout) {
      return null;
    }

    // Ensure user can only access their own checkouts
    if (checkout.userId !== userId) {
      throw new Error("Checkout not found");
    }

    return {
      status: checkout.status,
      checkoutId: checkout.checkoutId,
      amountInCents: checkout.amountInCents,
      createdAt: checkout.createdAt,
      completedAt: checkout.completedAt,
      paymentId: checkout.paymentId,
      errorMessage: checkout.errorMessage,
    };
  },
});

export const processPayment = action({
  args: {
    orderItems: v.array(
      v.object({
        itemId: v.id("inventoryItems"),
        quantity: v.number(),
      })
    ),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called processPayment without authentication");
    }

    const userId: string = identity.subject;

    if (args.orderItems.length === 0) {
      throw new Error("Cannot checkout an empty order");
    }

    const totalPriceInCents: number = await ctx.runQuery(
      internal.inventory.calculateOrderTotal,
      { orderItems: args.orderItems, userId }
    );

    if (totalPriceInCents <= 0) {
      throw new Error("Order total must be greater than zero");
    }

    const deviceId =
      SQUARE_ENVIRONMENT === "production"
        ? args.deviceId
        : SQUARE_SANDBOX_TEST_DEVICE_IDS.SUCCESS_NO_TIP;

    if (SQUARE_ENVIRONMENT === "production" && !args.deviceId) {
      throw new Error("Device ID is required in production");
    }

    try {
      const accessToken: string = await ctx.runAction(
        internal.square.square.getSquareAccessToken,
        { userId }
      );

      const client = new SquareClient({
        token: accessToken,
        environment: SQUARE_BASE_URL,
      });

      const amountMoney = {
        amount: BigInt(totalPriceInCents),
        currency: Currency.Cad,
      };

      const response = await client.terminal.checkouts.create({
        idempotencyKey: `${Date.now()}-${userId}`,
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
      if (!checkout || !checkout.id) {
        throw new Error(
          "No checkout returned from Square API. Please try again."
        );
      }

      await ctx.runMutation(internal.square.square.createTerminalCheckout, {
        checkoutId: checkout.id,
        userId,
        amountInCents: totalPriceInCents,
      });

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
