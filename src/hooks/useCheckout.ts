import { useState, useCallback, useRef, useEffect } from "react";
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
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
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
    // Wait for the dialog to close before setting the current checkout id to null
    // this is to prevent a loading state UI flash
    closeTimeoutRef.current = setTimeout(() => {
      setCurrentCheckoutId(null);
    }, 200);
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
