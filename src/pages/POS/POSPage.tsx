import { useState } from "react";
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

export const POSPage = () => {
  const [orderItems, setOrderItems] = useState<Doc<"inventoryItems">[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState<
    string | null | undefined
  >(null);
  const processPayment = useAction(api.square.square.processPayment);
  const allItems = useQuery(api.inventory.getAllItems) || [];
  const squareIntegration = useQuery(
    api.square.squareOAuth.getSquareIntegration
  );

  const handleBarcodeScanned = (barcode: string) => {
    toast.success(`Scanned: ${barcode}`);
    // TODO: Add logic to process the scanned barcode, e.g., add item to order
  };

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

  useBarcodeScanner(handleBarcodeScanned);

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

    setIsProcessingPayment(true);

    try {
      toast.info("Sending payment request to Square Terminal...");

      const result = await processPayment({
        orderItems: orderItems.map((item) => ({
          itemId: item._id,
          quantity: item.quantity,
        })),
      });

      setCurrentCheckoutId(result.checkoutId);
      toast.success(
        "Payment prompt sent to terminal! Please complete payment on the device."
      );

      // Note: Payment status polling would go here if getTerminalCheckoutStatus exists
      // For now, we'll clear the order items after a successful checkout creation
      setOrderItems([]);
      setIsProcessingPayment(false);
      setCurrentCheckoutId(undefined);
    } catch (error) {
      setIsProcessingPayment(false);
      setCurrentCheckoutId(null);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Checkout failed: ${errorMessage}`);
      console.error("Checkout error:", error);
    }
  };

  if (squareIntegration === undefined) {
    return <POSLoadingState />;
  }

  if (squareIntegration === null) {
    return <SquareIntegrationRequired />;
  }

  // Show POS interface when Square integration exists
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
    </PageWrapper>
  );
};
