import { query } from "./_generated/server";
import { v } from "convex/values";

export const getDashboardStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalItems = items.length;
    const availableItems = items.filter(
      (item) => item.status === "Available"
    ).length;
    const soldItems = items.filter((item) => item.status === "Sold").length;

    const totalInventoryValue = items
      .filter((item) => item.status === "Available")
      .reduce((sum, item) => sum + (item.sellingPrice || 0), 0);

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
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sortedItems = items
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return sortedItems;
  },
});

export const getRecentSales = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 3;
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
