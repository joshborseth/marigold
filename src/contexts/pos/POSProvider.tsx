import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAction, useQuery as useConvexQuery } from "convex/react";
import { useQuery as useReactQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useCheckout } from "@/hooks/useCheckout";
import { useOrderItems } from "@/hooks/useOrderItems";
import { POSContext, type POSContextValue } from "./pos-context";

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const hasAutoSelectedDevice = useRef(false);
  const allItemsQuery = useConvexQuery(api.inventory.getAllItems);
  const allItems = useMemo(() => allItemsQuery ?? [], [allItemsQuery]);
  const listDevices = useAction(api.square.square.listDevices);
  const {
    data: devicesData,
    isPending: devicesLoading,
    error: devicesQueryError,
    refetch: refetchDevicesQuery,
  } = useReactQuery({
    queryKey: ["square", "devices"],
    queryFn: async () => {
      const deviceList = await listDevices();
      if (
        !hasAutoSelectedDevice.current &&
        !selectedDeviceId &&
        deviceList.length > 0
      ) {
        hasAutoSelectedDevice.current = true;
        setSelectedDeviceId(deviceList[0].id);
      }
      return deviceList;
    },
  });
  const devices = useMemo(() => devicesData ?? [], [devicesData]);
  const devicesError = useMemo(() => {
    if (!devicesQueryError) {
      return null;
    }

    return devicesQueryError instanceof Error
      ? devicesQueryError.message
      : "Failed to load devices";
  }, [devicesQueryError]);
  const refetchDevices = useCallback(async () => {
    await refetchDevicesQuery();
  }, [refetchDevicesQuery]);
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
      devices,
      devicesLoading,
      devicesError,
      refetchDevices,
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
      devices,
      devicesError,
      devicesLoading,
      handleCheckout,
      handleCloseCheckoutDialog,
      increaseQuantity,
      isCheckoutDialogOpen,
      orderItems,
      refetchDevices,
      removeItem,
      requestingCheckout,
      selectedDeviceId,
      setSelectedDeviceId,
      setIsCheckoutDialogOpen,
    ]
  );

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};
