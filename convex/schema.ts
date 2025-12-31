import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Better Auth will automatically create its own user and session tables
  // We reference users via Better Auth's user management

  // Inventory items table
  inventoryItems: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    condition: v.string(), // "excellent", "good", "fair", "poor"
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    cost: v.optional(v.number()),
    sku: v.optional(v.string()),
    tags: v.array(v.string()),
    images: v.array(v.string()), // URLs to images
    status: v.string(), // "available", "sold", "reserved", "damaged"
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.string(), // Owner of the item (Better Auth user ID)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_sku", ["sku"]),

  // Categories table
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Sales/transactions table
  sales: defineTable({
    itemId: v.id("inventoryItems"),
    buyerName: v.optional(v.string()),
    buyerEmail: v.optional(v.string()),
    salePrice: v.number(),
    fees: v.optional(v.number()), // Platform fees, shipping, etc.
    profit: v.number(), // salePrice - cost - fees
    saleDate: v.number(),
    platform: v.optional(v.string()), // "ebay", "etsy", "facebook", "local", etc.
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["itemId"])
    .index("by_sale_date", ["saleDate"]),
});
