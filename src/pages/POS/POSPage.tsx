import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import { SquareIntegrationRequired } from "./SquareIntegrationRequired";
import { POSLoadingState } from "./POSLoadingState";
import { ItemSearch } from "./ItemSearch";
import { OrderItemsTable } from "./OrderItemsTable";
import { CheckoutFooter } from "./CheckoutFooter";
import { CheckoutStatusDialog } from "./CheckoutStatusDialog";
import { useOrderItems } from "@/hooks/useOrderItems";
import { useCheckout } from "@/hooks/useCheckout";
import { calculateOrderTotal } from "@/utils/posUtils";

export const POSPage = () => {
  const allItems = useQuery(api.inventory.getAllItems) || [];
  const squareIntegration = useQuery(
    api.square.squareOAuth.getSquareIntegration
  );

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
    reqestingCheckout,
  } = useCheckout(orderItems);

  useBarcodeScanner((barcode: string) => {
    const item = allItems.find((item) => item.sku === barcode);
    if (item) {
      toast.success(`Added ${item.title} to order`);
      addItem(item);
    } else {
      toast.error(
        `Item with SKU ${barcode} not found. Please check the SKU and try again.`
      );
    }
  });

  const handleCloseDialogAndClearOrder = () => {
    handleCloseCheckoutDialog();
    clearOrder();
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
      <ItemSearch allItems={allItems} onAddItem={addItem} />
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="flex-1 overflow-auto">
            <OrderItemsTable
              orderItems={orderItems}
              onDecreaseQuantity={decreaseQuantity}
              onIncreaseQuantity={increaseQuantity}
              onRemoveItem={removeItem}
            />
          </div>
        </CardContent>
        <CheckoutFooter
          total={calculateOrderTotal(orderItems)}
          onCheckout={handleCheckout}
          hasItems={orderItems.length > 0}
        />
      </Card>
      <CheckoutStatusDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        status={checkoutStatus?.status}
        errorMessage={checkoutStatus?.errorMessage}
        onClose={handleCloseDialogAndClearOrder}
        reqestingCheckout={reqestingCheckout}
      />
    </PageWrapper>
  );
};
