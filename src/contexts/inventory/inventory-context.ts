import { createContext } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";

type ItemToDelete = {
  _id: Doc<"inventoryItems">["_id"];
  title: string;
} | null;

export type InventoryContextValue = {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  editingItem: Doc<"inventoryItems"> | null;
  setEditingItem: (item: Doc<"inventoryItems"> | null) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  itemToDelete: ItemToDelete;
  setItemToDelete: (item: ItemToDelete) => void;
};

export const InventoryContext = createContext<InventoryContextValue | null>(
  null
);
