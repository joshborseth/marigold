import { useState, useEffect, useRef } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { SquareIntegrationRequired } from "./SquareIntegrationRequired";
import { POSLoadingState } from "./POSLoadingState";
import { ItemSearch } from "./ItemSearch";
import { OrderItemsTable } from "./OrderItemsTable";
import { CheckoutFooter } from "./CheckoutFooter";
import { CheckoutStatusDialog } from "./CheckoutStatusDialog";
import { SQUARE_CHECKOUT_STATUS } from "@/lib/constants";

export const POSPage = () => {
  const [orderItems, setOrderItems] = useState<Doc<"inventoryItems">[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState<
    string | null | undefined
  >(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const processPayment = useAction(api.square.square.processPayment);
  const allItems = useQuery(api.inventory.getAllItems) || [];
  const squareIntegration = useQuery(
    api.square.squareOAuth.getSquareIntegration
  );
  const checkoutStatus = useQuery(
    api.square.square.getCheckoutStatus,
    currentCheckoutId ? { checkoutId: currentCheckoutId } : "skip"
  );
  const previousStatusRef = useRef<string | null>(null);

  const handleAddItem = (item: Doc<"inventoryItems">) => {
    const existingItemIndex = orderItems.findIndex(
      (orderItem) => orderItem._id === item._id
    );
    if (existingItemIndex >= 0) {
      setOrderItems((prevItems) =>
        prevItems.map((orderItem, index) =>
          index === existingItemIndex
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
    } else {
      setOrderItems((prevItems) => [...prevItems, { ...item, quantity: 1 }]);
    }
  };

  useBarcodeScanner((barcode: string) => {
    toast.success(`Scanned: ${barcode}`);
    // TODO: Add logic to process the scanned barcode, e.g., add item to order
  });

  const handleCloseCheckoutDialog = () => {
    setIsCheckoutDialogOpen(false);
    setOrderItems([]);
    setIsProcessingPayment(false);
    setCurrentCheckoutId(null);
    setIsInitializingPayment(false);
    setCheckoutError(null);
    previousStatusRef.current = null;
  };

  useEffect(() => {
    if (!checkoutStatus || !currentCheckoutId) {
      previousStatusRef.current = null;
      return;
    }

    const status = checkoutStatus.status;
    // Only process if status has changed
    if (previousStatusRef.current === status) {
      return;
    }

    previousStatusRef.current = status;

 if (
      status === SQUARE_CHECKOUT_STATUS.CANCELED ||
      status === SQUARE_CHECKOUT_STATUS.FAILED
    ) {
      // Dialog stays open for user to manually close
      setIsProcessingPayment(false);
    }
  }, [checkoutStatus, currentCheckoutId]);

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + item.sellingPrice * item.quantity,
      0
    );
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setOrderItems((prevItems) => {
      return prevItems
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const handleIncreaseQuantity = (itemId: string) => {
    setOrderItems((prevItems) => {
      return prevItems.map((item) =>
        item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prevItems) => {
      return prevItems.filter((item) => item._id !== itemId);
    });
  };

  const handleCheckout = async () => {
    if (orderItems.length === 0) {
      toast.error("Cannot checkout an empty order.");
      return;
    }

    if (isProcessingPayment) {
      return;
    }

    setIsCheckoutDialogOpen(true);

    try {
      const result = await processPayment({
        orderItems: orderItems.map((item) => ({
          itemId: item._id,
          quantity: item.quantity,
        })),
      });

      setCurrentCheckoutId(result.checkoutId);
      setIsInitializingPayment(false);
      setCheckoutError(null);
    } catch (error) {
      setIsProcessingPayment(false);
      setCurrentCheckoutId(null);
      setIsInitializingPayment(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setCheckoutError(errorMessage);
      console.error("Checkout error:", error);
    }
  };

  if (squareIntegration === undefined) {
    return <POSLoadingState />;
  }

  if (squareIntegration === null) {
    return <SquareIntegrationRequired />;
  }

  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <ItemSearch allItems={allItems} onAddItem={handleAddItem} />
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="flex-1 overflow-auto">
            <OrderItemsTable
              orderItems={orderItems}
              onDecreaseQuantity={handleDecreaseQuantity}
              onIncreaseQuantity={handleIncreaseQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </CardContent>
        <CheckoutFooter
          total={calculateTotal()}
          onCheckout={handleCheckout}
          isProcessingPayment={isProcessingPayment}
          hasItems={orderItems.length > 0}
          currentCheckoutId={currentCheckoutId}
        />
      </Card>
      <CheckoutStatusDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        status={checkoutStatus?.status}
        errorMessage={checkoutError || checkoutStatus?.errorMessage}
        isInitializing={isInitializingPayment}
        onClose={handleCloseCheckoutDialog}
      />
    </PageWrapper>
  );
};
