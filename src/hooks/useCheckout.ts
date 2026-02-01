import { useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { OrderItem } from "./useOrderItems";

export const useCheckout = (orderItems: OrderItem[]) => {
  const [currentCheckoutId, setCurrentCheckoutId] = useState<
    string | null | undefined
  >(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [reqestingCheckout, setReqestingCheckout] = useState(false);
  const processPayment = useAction(api.square.square.processPayment);
  const checkoutStatus = useQuery(
    api.square.square.getCheckoutStatus,
    currentCheckoutId ? { checkoutId: currentCheckoutId } : "skip"
  );

  const handleCheckout = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error("Cannot checkout an empty order.");
      return;
    }

    setIsCheckoutDialogOpen(true);
    setReqestingCheckout(true);
    try {
      const result = await processPayment({
        orderItems: orderItems.map((item) => ({
          itemId: item._id,
          quantity: item.quantity,
        })),
      });

      setCurrentCheckoutId(result.checkoutId);
      setReqestingCheckout(false);
    } catch (error) {
      setCurrentCheckoutId(null);
    }
  }, [orderItems, processPayment]);

  const handleCloseCheckoutDialog = useCallback(() => {
    setIsCheckoutDialogOpen(false);
    setCurrentCheckoutId(null);
  }, []);

  return {
    isCheckoutDialogOpen,
    setIsCheckoutDialogOpen,
    checkoutStatus,
    handleCheckout,
    handleCloseCheckoutDialog,
    reqestingCheckout,
  };
};
