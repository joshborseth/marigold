import { useContext } from "react";
import { InventoryContext } from "./inventory-context";

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventoryContext must be used within InventoryProvider");
  }
  return context;
};
