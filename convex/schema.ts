import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  inventoryItems: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    condition: v.optional(v.string()),
    purchasePrice: v.optional(v.number()), // in cents
    sellingPrice: v.number(), // in cents
    sku: v.string(),
    quantity: v.number(),
    tags: v.array(v.string()),
    images: v.array(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_sku", ["sku"]),

  sales: defineTable({
    itemId: v.id("inventoryItems"),
    buyerName: v.optional(v.string()),
    buyerEmail: v.optional(v.string()),
    salePrice: v.number(), // in cents
    saleDate: v.number(),
    profit: v.number(),
    platform: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["itemId"])
    .index("by_sale_date", ["saleDate"]),

  squareIntegrations: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    merchantId: v.optional(v.string()),
    connectedAt: v.number(),
  }).index("by_user", ["userId"]),

  squareTerminalCheckouts: defineTable({
    checkoutId: v.string(), // Square checkout ID
    userId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELED"),
      v.literal("FAILED")
    ),
    amountInCents: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_checkout_id", ["checkoutId"])
    .index("by_user_created", ["userId", "createdAt"]),
});
