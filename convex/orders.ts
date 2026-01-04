import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrder = mutation({
  args: {
    itemIds: v.array(v.id("inventoryItems")),
    totalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createOrder without authentication");
    }

    const userId = identity.subject;

    await ctx.db.insert("orders", {
      itemIds: args.itemIds,
      totalPrice: args.totalPrice,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const getOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getOrder = query({
  args: {
    id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getOrder without authentication");
    }
    const userId = identity.subject;
    const order = await ctx.db.get(args.id);

    if (!order || order.userId !== userId) {
      return null;
    }
    return order;
  },
});
