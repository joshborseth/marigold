import { query, mutation, internalQuery } from "./_generated/server";
import { dollarsToCents } from "../src/lib/utils";

const SKU_LENGTH = 8;

function generateSKU(): string {
  const randomString = Math.random()
    .toString(36)
    .substring(2, 2 + SKU_LENGTH)
    .toUpperCase();
  return randomString;
}
import { v } from "convex/values";

export const getAllItems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getAllItems without authentication");
    }
    const userId = identity.subject;
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return items;
  },
});

export const getItemBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getItemBySku without authentication");
    }
    return await ctx.db
      .query("inventoryItems")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
  },
});

export const createItem = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    condition: v.optional(v.string()),
    purchasePrice: v.optional(v.number()), // in dollars from UI
    sellingPrice: v.number(), // in dollars from UI
    sku: v.optional(v.string()),
    quantity: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called createItem without authentication");
    }
    const userId = identity.subject;
    const now = Date.now();
    const purchasePriceInCents = args.purchasePrice
      ? dollarsToCents(args.purchasePrice)
      : undefined;
    const sellingPriceInCents = dollarsToCents(args.sellingPrice);

    const itemId = await ctx.db.insert("inventoryItems", {
      title: args.title,
      description: args.description,
      category: args.category,
      condition: args.condition,
      purchasePrice: purchasePriceInCents,
      sellingPrice: sellingPriceInCents,
      sku: generateSKU(),
      quantity: args.quantity ?? 1,
      tags: args.tags || [],
      images: args.images || [],
      status: args.status,
      notes: args.notes,
      userId,
      createdAt: now,
      updatedAt: now,
    });
    return itemId;
  },
});

export const updateItem = mutation({
  args: {
    id: v.id("inventoryItems"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    condition: v.optional(v.string()),
    purchasePrice: v.optional(v.number()), // in dollars from UI
    sellingPrice: v.number(), // in dollars from UI
    sku: v.optional(v.string()),
    quantity: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called updateItem without authentication");
    }
    const userId = identity.subject;
    const { id, purchasePrice, sellingPrice, ...otherUpdates } = args;

    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) {
      throw new Error("Item not found");
    }

    const purchasePriceInCents = purchasePrice
      ? dollarsToCents(purchasePrice)
      : undefined;
    const sellingPriceInCents = dollarsToCents(sellingPrice);

    await ctx.db.patch(id, {
      ...otherUpdates,
      purchasePrice: purchasePriceInCents,
      sellingPrice: sellingPriceInCents,
      quantity: otherUpdates.quantity ?? item.quantity,
      tags: otherUpdates.tags || [],
      images: otherUpdates.images || [],
      updatedAt: Date.now(),
    });
  },
});

export const deleteItem = mutation({
  args: {
    id: v.id("inventoryItems"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called deleteItem without authentication");
    }
    const userId = identity.subject;
    const item = await ctx.db.get(args.id);
    if (!item || item.userId !== userId) {
      throw new Error("Item not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const calculateOrderTotal = internalQuery({
  args: {
    orderItems: v.array(
      v.object({
        itemId: v.id("inventoryItems"),
        quantity: v.number(),
      })
    ),
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<number> => {
    let totalInCents = 0;

    for (const orderItem of args.orderItems) {
      const item = await ctx.db.get(orderItem.itemId);
      if (!item || item.userId !== args.userId) {
        throw new Error(`Item ${orderItem.itemId} not found`);
      }
      totalInCents += item.sellingPrice * orderItem.quantity;
    }

    return totalInCents;
  },
});
