import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { OrderItem } from "./useOrderItems";

const DIALOG_CLOSE_ANIMATION_MS = 200;

export const useCheckout = (orderItems: OrderItem[]) => {
  const [currentCheckoutId, setCurrentCheckoutId] = useState<
    string | null | undefined
  >(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [requestingCheckout, setRequestingCheckout] = useState(false);
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

  const handleCheckout = useCallback(
    async (deviceId: string | null) => {
      if (orderItems.length === 0) {
        toast.error("Cannot checkout an empty order.");
        return;
      }
      if (!deviceId) {
        toast.error("Please select a device to checkout.");
        return;
      }
      setIsCheckoutDialogOpen(true);
      setRequestingCheckout(true);
      try {
        const result = await processPayment({
          orderItems: orderItems.map((item) => ({
            itemId: item._id,
            quantity: item.quantity,
          })),
          deviceId: deviceId,
        });

        setCurrentCheckoutId(result.checkoutId);
        setRequestingCheckout(false);
      } catch {
        setCurrentCheckoutId(null);
      }
    },
    [orderItems, processPayment]
  );

  const handleCloseCheckoutDialog = useCallback(() => {
    setIsCheckoutDialogOpen(false);
    // Delay clearing the checkout ID to allow the dialog close animation to complete
    // This prevents a UI flash where the status switches to "loading" during the animation
    closeTimeoutRef.current = setTimeout(() => {
      setCurrentCheckoutId(null);
    }, DIALOG_CLOSE_ANIMATION_MS);
  }, []);

  return {
    isCheckoutDialogOpen,
    setIsCheckoutDialogOpen,
    checkoutStatus,
    handleCheckout,
    handleCloseCheckoutDialog,
    requestingCheckout,
  };
};
