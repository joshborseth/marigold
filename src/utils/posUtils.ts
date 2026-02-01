import type { Doc } from "../../convex/_generated/dataModel";

/**
 * Calculates the total price of all items in an order
 */
export const calculateOrderTotal = (
  orderItems: Doc<"inventoryItems">[]
): number => {
  return orderItems.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
};
