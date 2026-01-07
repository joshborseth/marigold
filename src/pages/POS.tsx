import { useState, useEffect } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import {
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageWrapper from "@/components/PageWrapper";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const POS = () => {
  const [orderItems, setOrderItems] = useState<Doc<"inventoryItems">[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState<
    string | null | undefined
  >(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const createOrder = useMutation(api.orders.createOrder);
  const createTerminalCheckout = useAction(api.square.createTerminalCheckout);
  const getTerminalCheckoutStatus = useAction(
    api.square.getTerminalCheckoutStatus
  );
  const allItems = useQuery(api.inventory.getAllItems) || [];
  const squareIntegration = useQuery(api.squareOAuth.getSquareIntegration);
  const getTerminalDevices = useAction(api.square.getTerminalDevices);
  const [terminalDevices, setTerminalDevices] = useState<Array<{
    id: string;
    name: string;
    status: string;
  }> | null>(null);

  const handleBarcodeScanned = (barcode: string) => {
    toast.success(`Scanned: ${barcode}`);
    // TODO: Add logic to process the scanned barcode, e.g., add item to order
  };

  const handleAddItem = (item: Doc<"inventoryItems">) => {
    const existingItemIndex = orderItems.findIndex(
      (orderItem) => orderItem._id === item._id
    );

    if (existingItemIndex >= 0) {
      // Item already in cart, increase quantity
      setOrderItems((prevItems) =>
        prevItems.map((orderItem, index) =>
          index === existingItemIndex
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        )
      );
      toast.success(`Added ${item.title} (quantity increased)`);
    } else {
      // New item, add to cart with quantity 1
      setOrderItems((prevItems) => [...prevItems, { ...item, quantity: 1 }]);
      toast.success(`Added ${item.title} to cart`);
    }

    setSearchOpen(false);
    setSearchQuery("");
  };

  const filteredItems = allItems.filter((item) => {
    if (!searchQuery) return true; // Show all items when search is empty
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  useBarcodeScanner(handleBarcodeScanned);

  // Fetch terminal devices when Square integration is available
  useEffect(() => {
    let cancelled = false;

    if (squareIntegration?.connected && !squareIntegration?.isExpired) {
      getTerminalDevices()
        .then((devices) => {
          if (!cancelled) {
            setTerminalDevices(devices);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error("Failed to fetch terminal devices:", error);
            setTerminalDevices([]);
          }
        });
    } else if (squareIntegration !== undefined) {
      // Only reset if we have a definitive answer about the integration status
      // Use setTimeout to avoid synchronous setState
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          setTerminalDevices(null);
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    return () => {
      cancelled = true;
    };
  }, [
    squareIntegration?.connected,
    squareIntegration?.isExpired,
    getTerminalDevices,
    squareIntegration,
  ]);

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

  const handleSquarePayment = async () => {
    if (orderItems.length === 0) {
      toast.error("Cannot process payment for an empty order.");
      return;
    }

    if (isProcessingPayment) {
      return;
    }

    setIsProcessingPayment(true);
    let orderId: Id<"orders"> | undefined = undefined;

    try {
      const itemIds = orderItems.map((item) => item._id);
      const totalPrice = calculateTotal();

      // First, create the order
      const createdOrderId = await createOrder({
        itemIds,
        totalPrice,
      });
      orderId = createdOrderId as Id<"orders"> | undefined;

      toast.info("Sending payment request to Square Terminal...");

      // Create terminal checkout
      const checkoutResult = await createTerminalCheckout({
        amount: totalPrice,
        orderId,
      });

      setCurrentCheckoutId(checkoutResult.checkoutId);
      toast.success(
        "Payment prompt sent to terminal! Please complete payment on the device."
      );

      // Poll for payment status
      const pollInterval = setInterval(async () => {
        try {
          const statusResult = await getTerminalCheckoutStatus({
            checkoutId: checkoutResult.checkoutId,
            orderId,
          });

          if (statusResult.status === "COMPLETED") {
            clearInterval(pollInterval);
            setIsProcessingPayment(false);
            setCurrentCheckoutId(undefined);
            setOrderItems([]);
            toast.success("Payment completed successfully!");
          } else if (
            statusResult.status === "CANCELED" ||
            statusResult.status === "FAILED"
          ) {
            clearInterval(pollInterval);
            setIsProcessingPayment(false);
            setCurrentCheckoutId(undefined);
            toast.error("Payment was canceled or failed.");
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
        }
      }, 2000); // Poll every 2 seconds

      // Stop polling after 5 minutes
      setTimeout(
        () => {
          clearInterval(pollInterval);
          if (isProcessingPayment) {
            setIsProcessingPayment(false);
            setCurrentCheckoutId(null);
            toast.warning("Payment timeout. Please check the terminal status.");
          }
        },
        5 * 60 * 1000
      );
    } catch (error) {
      setIsProcessingPayment(false);
      setCurrentCheckoutId(null);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Payment failed: ${errorMessage}`);
      console.error("Square payment error:", error);
    }
  };

  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="mb-4">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search items to add...
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name, SKU, or description..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No items found.</CommandEmpty>
                    <CommandGroup>
                      {filteredItems.map((item) => (
                        <CommandItem
                          key={item._id}
                          value={`${item.title} ${item.sku}`}
                          onSelect={() => handleAddItem(item)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {item.sku} • $
                              {item.sellingPrice?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Square Terminal Status */}
          {squareIntegration === undefined ? (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking Square connection...</span>
            </div>
          ) : squareIntegration === null ? (
            <Alert className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Square account not connected.{" "}
                <a
                  href="/integrations"
                  className="underline font-medium hover:text-primary"
                >
                  Connect your Square account
                </a>{" "}
                to enable payment processing.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      squareIntegration.isExpired ? "destructive" : "default"
                    }
                    className="flex items-center gap-1"
                  >
                    {squareIntegration.isExpired ? (
                      <>
                        <XCircle className="h-3 w-3" />
                        Square Expired
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Square Connected
                      </>
                    )}
                  </Badge>
                  {terminalDevices && terminalDevices.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {terminalDevices.length} terminal
                      {terminalDevices.length !== 1 ? "s" : ""} available
                    </span>
                  )}
                </div>
              </div>
              {terminalDevices && terminalDevices.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {terminalDevices.map((device) => (
                    <div key={device.id} className="flex items-center gap-2">
                      <span className="font-mono">{device.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {device.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                            className="h-8 w-8 text-muted-foreground hover:text-muted-foreground"
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
          <div className="flex flex-col gap-4 w-full py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Total: ${calculateTotal().toFixed(2)}
              </h2>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={orderItems.length === 0 || isProcessingPayment}
                  variant="outline"
                >
                  Checkout (No Payment)
                </Button>
                <Button
                  size="lg"
                  onClick={handleSquarePayment}
                  disabled={
                    orderItems.length === 0 ||
                    !!isProcessingPayment ||
                    !squareIntegration?.connected ||
                    !!squareIntegration?.isExpired
                  }
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isProcessingPayment
                    ? "Processing..."
                    : "Pay with Square Terminal"}
                </Button>
              </div>
            </div>
            {isProcessingPayment && currentCheckoutId && (
              <div className="text-sm text-muted-foreground">
                Waiting for payment on terminal... (Checkout ID:{" "}
                {currentCheckoutId.slice(0, 8)}...)
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
};
