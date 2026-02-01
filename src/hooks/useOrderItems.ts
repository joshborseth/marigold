import { useState, useCallback } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

export type OrderItem = Doc<"inventoryItems">;

export const useOrderItems = () => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const addItem = useCallback((item: Doc<"inventoryItems">) => {
    setOrderItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (orderItem) => orderItem._id === item._id
      );
      if (existingItemIndex >= 0) {
        return prevItems.map((orderItem, index) =>
          index === existingItemIndex
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });
  }, []);

  const increaseQuantity = useCallback((itemId: string) => {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((itemId: string) => {
    setOrderItems((prevItems) => {
      return prevItems
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item._id !== itemId)
    );
  }, []);

  const clearOrder = useCallback(() => {
    setOrderItems([]);
  }, []);

  return {
    orderItems,
    addItem,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearOrder,
  };
};
