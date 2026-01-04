import { query, mutation } from "./_generated/server";

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
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
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
    const itemId = await ctx.db.insert("inventoryItems", {
      title: args.title,
      description: args.description,
      category: args.category,
      condition: args.condition,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
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
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
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
    const { id, ...updates } = args;

    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) {
      throw new Error("Item not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      quantity: updates.quantity ?? item.quantity,
      tags: updates.tags || [],
      images: updates.images || [],
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
