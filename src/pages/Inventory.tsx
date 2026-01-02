import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ItemStatusBadge from "@/components/ItemStatusBadge";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Loader from "@/components/Loader";
import PageWrapper from "@/components/PageWrapper";
import AddItemForm from "@/components/AddItemForm";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Inventory() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const items = useQuery(
    api.inventory.getAllItems,
    userId ? { userId } : "skip"
  );

  if (sessionPending || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  const isLoading = items === undefined;

  return (
    <>
      <PageWrapper
        title="Inventory"
        description="View and manage all your inventory items"
        action={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader size="lg" />
          </div>
        ) : items.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Package className="h-6 w-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No items yet</EmptyTitle>
              <EmptyDescription>
                Start adding items to your inventory to see them here.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <ItemStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>{item.condition || "-"}</TableCell>
                    <TableCell>
                      {item.purchasePrice
                        ? formatCurrency(item.purchasePrice)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {item.sellingPrice
                        ? formatCurrency(item.sellingPrice)
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageWrapper>
      <AddItemForm open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
