import { query } from "./_generated/server";
import { v } from "convex/values";

// Get dashboard statistics for the current user
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
    const availableItems = items.filter((item) => item.status === "available").length;
    const soldItems = items.filter((item) => item.status === "sold").length;

    // Calculate total inventory value (sum of selling prices for available items)
    const totalInventoryValue = items.filter((item) => item.status === "available").reduce((sum, item) => sum + (item.sellingPrice || 0), 0);

    // Calculate total profit from sales
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSales = sales.filter((sale) => sale.saleDate >= thirtyDaysAgo);
    const recentProfit = recentSales.reduce((sum, sale) => sum + sale.profit, 0);
    const recentRevenue = recentSales.reduce((sum, sale) => sum + sale.salePrice, 0);

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

// Get recent inventory items
export const getRecentItems = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by createdAt descending and take the most recent items
    const sortedItems = items.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);

    return sortedItems;
  },
});

// Get recent sales
export const getRecentSales = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by saleDate descending and take the most recent sales
    const sortedSales = sales.sort((a, b) => b.saleDate - a.saleDate).slice(0, limit);

    // Fetch the associated items for each sale
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

// Get sales by status for chart
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
