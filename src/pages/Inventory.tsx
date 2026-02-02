import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemStatus } from "@/components/ItemStatus";
import { Button } from "@/components/ui/button";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader } from "@/components/Loader";
import { PageWrapper } from "@/components/PageWrapper";
import { AddItemForm } from "@/components/AddItemForm";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Inventory = () => {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc<"inventoryItems"> | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    _id: Doc<"inventoryItems">["_id"];
    title: string;
  } | null>(null);

  const items = useQuery(api.inventory.getAllItems, userId ? {} : "skip");
  const deleteItem = useMutation(api.inventory.deleteItem);

  if (sessionPending || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  const isLoading = items === undefined;

  type InventoryItem = NonNullable<typeof items>[number];

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete({ _id: item._id, title: item.title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem({
        id: itemToDelete._id,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

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
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity ?? 1}</TableCell>
                    <TableCell>
                      <ItemStatus style="badge" status={item.status} />
                    </TableCell>
                    <TableCell>{item.condition || "-"}</TableCell>
                    <TableCell>
                      {item.purchasePrice
                        ? formatCurrency(item.purchasePrice)
                        : "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 text-muted-foreground hover:text-muted-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageWrapper>
      <AddItemForm
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        item={editingItem}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              item "{itemToDelete?.title}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
