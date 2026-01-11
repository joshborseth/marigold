import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { centsToDollars } from "@/lib/utils";

interface OrderItemRowProps {
  item: Doc<"inventoryItems"> & { quantity: number };
  onDecreaseQuantity: (itemId: string) => void;
  onIncreaseQuantity: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export const OrderItemRow = ({
  item,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveItem,
}: OrderItemRowProps) => {
  const lineTotalInDollars = centsToDollars(item.sellingPrice * item.quantity);
  return (
    <TableRow>
      <TableCell className="font-medium">{item.title}</TableCell>
      <TableCell>{item.sku}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell className="text-right">
        ${lineTotalInDollars.toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDecreaseQuantity(item._id)}
            className="h-8 w-8 text-muted-foreground hover:text-muted-foreground"
            title="Remove one"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onIncreaseQuantity(item._id)}
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
            onClick={() => onRemoveItem(item._id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Remove all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
