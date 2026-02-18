import { useState, type ReactNode } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { InventoryContext } from "./inventory-context";

type ItemToDelete = {
  _id: Doc<"inventoryItems">["_id"];
  title: string;
} | null;

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc<"inventoryItems"> | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);

  return (
    <InventoryContext.Provider
      value={{
        isDialogOpen,
        setIsDialogOpen,
        editingItem,
        setEditingItem,
        deleteDialogOpen,
        setDeleteDialogOpen,
        itemToDelete,
        setItemToDelete,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
