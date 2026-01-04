import { useState } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import { Trash2, Minus, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PageWrapper from "@/components/PageWrapper";

export const POS = () => {
  const [orderItems, setOrderItems] = useState<Doc<"inventoryItems">[]>([]);
  const createOrder = useMutation(api.orders.createOrder);

  const handleBarcodeScanned = (barcode: string) => {
    toast.success(`Scanned: ${barcode}`);
    // TODO: Add logic to process the scanned barcode, e.g., add item to order
  };

  useBarcodeScanner(handleBarcodeScanned);

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + (item.sellingPrice || 0) * item.quantity,
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
    try {
      const itemIds = orderItems.map((item) => item._id);
      const totalPrice = calculateTotal();
      await createOrder({
        itemIds,
        totalPrice,
      });
      setOrderItems([]);
      toast.success("Order placed successfully!");
    } catch (error) {
      toast.error("Failed to place order.");
      console.error("Checkout error:", error);
    }
  };

  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="flex-1 overflow-auto">
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-lg mb-2">
                  Ready to scan
                </p>
                <p className="text-sm text-muted-foreground">
                  Scan a barcode or start adding items to begin
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-[150px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${((item.sellingPrice || 0) * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDecreaseQuantity(item._id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remove one"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleIncreaseQuantity(item._id)}
                            className="h-8 w-8 text-success hover:text-success"
                            title="Add one"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Separator
                            orientation="vertical"
                            className="mx-1 data-[orientation=vertical]:h-4"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item._id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remove all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t">
          <div className="flex justify-between items-center w-full py-4">
            <h2 className="text-2xl font-bold">
              Total: ${calculateTotal().toFixed(2)}
            </h2>
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={orderItems.length === 0}
            >
              Checkout
            </Button>
          </div>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
};
