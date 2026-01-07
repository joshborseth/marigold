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

  orders: defineTable({
    itemIds: v.array(v.id("inventoryItems")),
    totalPrice: v.number(),
    userId: v.string(),
    createdAt: v.number(),
    paymentStatus: v.optional(v.string()), // "pending", "completed", "failed"
    squarePaymentId: v.optional(v.string()),
    squareTerminalCheckoutId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  squareIntegrations: defineTable({
    userId: v.string(),
    accessToken: v.string(), // Encrypted access token
    refreshToken: v.optional(v.string()), // Encrypted refresh token
    expiresAt: v.optional(v.number()), // Token expiration timestamp
    merchantId: v.optional(v.string()), // Square merchant ID
    environment: v.string(), // "sandbox" or "production"
    connectedAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_merchant", ["merchantId"]),
});
