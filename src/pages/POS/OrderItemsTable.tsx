import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Doc } from "../../../convex/_generated/dataModel";
import { EmptyOrderState } from "./EmptyOrderState";
import { OrderItemRow } from "./OrderItemRow";

interface OrderItemsTableProps {
  orderItems: (Doc<"inventoryItems"> & { quantity: number })[];
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const OrderItemsTable = ({
  orderItems,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveItem,
}: OrderItemsTableProps) => {
  if (orderItems.length === 0) {
    return <EmptyOrderState />;
  }

  return (
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
          <OrderItemRow
            key={item._id}
            item={item}
            onDecreaseQuantity={onDecreaseQuantity}
            onIncreaseQuantity={onIncreaseQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </TableBody>
    </Table>
  );
};


