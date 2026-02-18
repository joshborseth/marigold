import { createContext } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import type { OrderItem } from "@/hooks/useOrderItems";

export type POSContextValue = {
  orderItems: OrderItem[];
  addItem: (item: OrderItem) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clearOrder: () => void;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string | null) => void;
  isCheckoutDialogOpen: boolean;
  setIsCheckoutDialogOpen: (open: boolean) => void;
  checkoutStatus:
    | FunctionReturnType<typeof api.square.square.getCheckoutStatus>
    | undefined;
  requestingCheckout: boolean;
  handleCheckout: (deviceId: string | null) => Promise<void>;
  handleCloseCheckoutDialog: () => Promise<void>;
};

export const POSContext = createContext<POSContextValue | null>(null);
