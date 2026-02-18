import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useCheckout } from "@/hooks/useCheckout";
import { useOrderItems } from "@/hooks/useOrderItems";
import { POSContext, type POSContextValue } from "./pos-context";

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const allItemsQuery = useQuery(api.inventory.getAllItems);
  const allItems = useMemo(() => allItemsQuery ?? [], [allItemsQuery]);
  const {
    orderItems,
    addItem,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearOrder,
  } = useOrderItems();

  const {
    isCheckoutDialogOpen,
    setIsCheckoutDialogOpen,
    checkoutStatus,
    handleCheckout,
    handleCloseCheckoutDialog,
    requestingCheckout,
  } = useCheckout(orderItems);

  useBarcodeScanner((barcode: string) => {
    const item = allItems.find(
      (inventoryItem) => inventoryItem.sku === barcode
    );
    if (item) {
      toast.success(`Added ${item.title} to order`);
      addItem(item);
    } else {
      toast.error(
        `Item with SKU ${barcode} not found. Please check the SKU and try again.`
      );
    }
  });

  const value = useMemo<POSContextValue>(
    () => ({
      orderItems,
      addItem,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearOrder,
      selectedDeviceId,
      setSelectedDeviceId,
      isCheckoutDialogOpen,
      setIsCheckoutDialogOpen,
      checkoutStatus,
      requestingCheckout,
      handleCheckout,
      handleCloseCheckoutDialog,
    }),
    [
      addItem,
      clearOrder,
      checkoutStatus,
      decreaseQuantity,
      handleCheckout,
      handleCloseCheckoutDialog,
      increaseQuantity,
      isCheckoutDialogOpen,
      orderItems,
      removeItem,
      requestingCheckout,
      selectedDeviceId,
      setIsCheckoutDialogOpen,
    ]
  );

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
