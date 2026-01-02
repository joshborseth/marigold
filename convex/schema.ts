import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  inventoryItems: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    condition: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    sku: v.optional(v.string()),
    tags: v.array(v.string()),
    images: v.array(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_sku", ["sku"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  sales: defineTable({
    itemId: v.id("inventoryItems"),
    buyerName: v.optional(v.string()),
    buyerEmail: v.optional(v.string()),
    salePrice: v.number(),
    fees: v.optional(v.number()),
    profit: v.number(),
    saleDate: v.number(),
    platform: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["itemId"])
    .index("by_sale_date", ["saleDate"]),
});
