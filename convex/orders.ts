import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Internal mutation to create an order in the database
export const createOrderInternal = internalMutation({
  args: {
    itemIds: v.array(v.id("inventoryItems")),
    totalPrice: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      itemIds: args.itemIds,
      totalPrice: args.totalPrice,
      userId: args.userId,
      createdAt: Date.now(),
    });

    return orderId;
  },
});

// Action that creates an order and automatically creates a terminal checkout
export const createOrder = action({
  args: {
    itemIds: v.array(v.id("inventoryItems")),
    totalPrice: v.number(),
    deviceId: v.optional(v.string()), // Optional device ID for Square Terminal
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    orderId: Id<"orders">;
    checkoutId: string | undefined;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createOrder without authentication");
    }

    const userId = identity.subject;

    // First, create the order in the database
    const orderId = await ctx.runMutation(internal.orders.createOrderInternal, {
      itemIds: args.itemIds,
      totalPrice: args.totalPrice,
      userId,
    });

    // Then, create the terminal checkout (convert dollars to cents)
    const checkoutResult = await ctx.runAction(
      internal.square.createTerminalCheckoutInternal,
      {
        amount: Math.round(args.totalPrice * 100),
        orderId: orderId as Id<"orders">,
        deviceId: args.deviceId,
        userId,
      }
    );

    return {
      orderId,
      checkoutId: checkoutResult.checkoutId,
    };
  },
});
