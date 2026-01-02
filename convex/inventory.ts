import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAllItems = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by createdAt descending (newest first)
    const sortedItems = items.sort((a, b) => b.createdAt - a.createdAt);

    return sortedItems;
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
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    status: v.string(),
    notes: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const itemId = await ctx.db.insert("inventoryItems", {
      title: args.title,
      description: args.description,
      category: args.category,
      condition: args.condition,
      purchasePrice: args.purchasePrice,
      sellingPrice: args.sellingPrice,
      sku: args.sku,
      tags: args.tags || [],
      images: args.images || [],
      status: args.status,
      notes: args.notes,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
    return itemId;
  },
});
