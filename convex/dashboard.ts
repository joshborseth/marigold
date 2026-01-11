import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getDashboardStats without authentication");
    }
    const userId = identity.subject;

    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalItems = items.length;
    const availableItems = items.filter(
      (item) => item.status === "Available"
    ).length;
    const soldItems = items.filter((item) => item.status === "Sold").length;

    const totalInventoryValue = items
      .filter((item) => item.status === "Available")
      .reduce((sum, item) => sum + item.sellingPrice, 0);

    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSales = sales.filter((sale) => sale.saleDate >= thirtyDaysAgo);
    const recentProfit = recentSales.reduce(
      (sum, sale) => sum + sale.profit,
      0
    );
    const recentRevenue = recentSales.reduce(
      (sum, sale) => sum + sale.salePrice,
      0
    );

    return {
      totalItems,
      availableItems,
      soldItems,
      totalInventoryValue,
      totalProfit,
      totalRevenue,
      recentProfit,
      recentRevenue,
      recentSalesCount: recentSales.length,
    };
  },
});

export const getRecentItems = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getRecentItems without authentication");
    }
    const userId = identity.subject;
    const limit = args.limit || 3;
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return items;
  },
});

export const getRecentSales = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getRecentSales without authentication");
    }
    const userId = identity.subject;
    const limit = args.limit || 3;
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const sortedSales = sales
      .sort((a, b) => b.saleDate - a.saleDate)
      .slice(0, limit);

    const salesWithItems = await Promise.all(
      sortedSales.map(async (sale) => {
        const item = await ctx.db.get(sale.itemId);
        return {
          ...sale,
          item,
        };
      })
    );

    return salesWithItems;
  },
});

export const getItemsByStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called getItemsByStatus without authentication");
    }
    const userId = identity.subject;
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .collect();

    const statusCounts = items.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  },
});
