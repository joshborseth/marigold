import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";

export const POS = () => {
  const [scannedSku, setScannedSku] = useState("");
  const [orderItems, setOrderItems] = useState<Doc<"inventoryItems">[]>([]);
  const orderItemsRef = useRef(orderItems);
  useEffect(() => {
    orderItemsRef.current = orderItems;
  }, [orderItems]);
  const inputRef = useRef<HTMLInputElement>(null);

  const getItemBySku = useQuery(
    api.inventory.getItemBySku,
    scannedSku ? { sku: scannedSku } : "skip"
  );
  const createOrder = useMutation(api.orders.createOrder);

  useEffect(() => {
    if (getItemBySku) {
      const existingItemIndex = orderItemsRef.current.findIndex(
        (item) => item._id === getItemBySku._id
      );
      if (existingItemIndex > -1) {
        setOrderItems((prevItems) =>
          prevItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setOrderItems((prev) => [
          ...prev,
          {
            ...getItemBySku,
            quantity: 1,
            sellingPrice: getItemBySku.sellingPrice || 0,
          },
        ]);
      }
      setScannedSku(""); // Clear after adding
      toast.success(`${getItemBySku.title} added to order.`);
    } else if (scannedSku && getItemBySku === null) {
      toast.error("Item not found.");
      setScannedSku(""); // Clear even if not found
    }
  }, [getItemBySku, scannedSku]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (inputRef.current && event.key === "Enter") {
        inputRef.current.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    // The useEffect will handle adding the item once getItemBySku resolves
  };

  const calculateTotal = () => {
    return orderItems.reduce(
      (sum, item) => sum + (item.sellingPrice || 0) * item.quantity,
      0
    );
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
    <div className="flex h-full gap-4 p-4">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Point of Sale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <form onSubmit={handleBarcodeScan} className="mb-4">
            <Label htmlFor="barcode">Scan Barcode</Label>
            <Input
              id="barcode"
              type="text"
              value={scannedSku}
              onChange={(e) => setScannedSku(e.target.value)}
              className="mt-1"
              ref={inputRef}
              autoFocus
            />
          </form>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${((item.sellingPrice || 0) * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <h2 className="text-2xl font-bold">
            Total: ${calculateTotal().toFixed(2)}
          </h2>
          <Button size="lg" onClick={handleCheckout}>
            Checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
