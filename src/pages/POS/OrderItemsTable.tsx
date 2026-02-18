import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyOrderState } from "./EmptyOrderState";
import { OrderItemRow } from "./OrderItemRow";
import { usePOSContext } from "@/contexts";

export const OrderItemsTable = () => {
  const { orderItems } = usePOSContext();
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
          <OrderItemRow key={item._id} item={item} />
        ))}
      </TableBody>
    </Table>
  );
};
