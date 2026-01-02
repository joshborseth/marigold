import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Plus,
  Box,
  CheckCircle2,
} from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Loader from "@/components/Loader";
import type { Id } from "../../convex/_generated/dataModel";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id;

  const stats = useQuery(
    api.dashboard.getDashboardStats,
    userId ? { userId } : "skip"
  );
  const recentItems = useQuery(
    api.dashboard.getRecentItems,
    userId ? { userId, limit: 5 } : "skip"
  );
  const recentSales = useQuery(
    api.dashboard.getRecentSales,
    userId ? { userId, limit: 5 } : "skip"
  );
  const itemsByStatus = useQuery(
    api.dashboard.getItemsByStatus,
    userId ? { userId } : "skip"
  );

  if (sessionPending || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  const isLoading = !stats || !recentItems || !recentSales || !itemsByStatus;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your inventory and sales
        </p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Items
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.availableItems} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inventory Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalInventoryValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total value of available items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Profit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.recentProfit)} last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.recentSalesCount} sales last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Available</span>
                  </div>
                  <span className="font-semibold">{stats.availableItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Sold</span>
                  </div>
                  <span className="font-semibold">{stats.soldItems}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Items */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 flex flex-col space-y-1.5">
                    <CardTitle>Recent Items</CardTitle>
                    <CardDescription>
                      Latest additions to your inventory
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentItems.length === 0 ? (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Box className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No items yet</EmptyTitle>
                      <EmptyDescription>
                        Start adding items to your inventory to see them here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-4">
                    {recentItems.map(
                      (item: {
                        _id: Id<"inventoryItems">;
                        title: string;
                        status: string;
                        category: string;
                        sellingPrice?: number;
                      }) => (
                        <div
                          key={item._id}
                          className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <Badge
                                variant={
                                  item.status === "available"
                                    ? "default"
                                    : item.status === "sold"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {item.category}
                            </p>
                            {item.sellingPrice && (
                              <p className="text-sm font-medium">
                                {formatCurrency(item.sellingPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <ShoppingCart className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No sales yet</EmptyTitle>
                      <EmptyDescription>
                        Sales will appear here once you start making
                        transactions.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map(
                      (sale: {
                        _id: Id<"sales">;
                        salePrice: number;
                        profit: number;
                        saleDate: number;
                        platform?: string;
                        item?: {
                          title: string;
                        } | null;
                      }) => (
                        <div
                          key={sale._id}
                          className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {sale.item?.title || "Unknown Item"}
                              </h4>
                              {sale.platform && (
                                <Badge variant="outline">{sale.platform}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {formatDate(sale.saleDate)}
                            </p>
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">
                                  Sale:{" "}
                                </span>
                                <span className="text-sm font-medium">
                                  {formatCurrency(sale.salePrice)}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">
                                  Profit:{" "}
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  {formatCurrency(sale.profit)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
