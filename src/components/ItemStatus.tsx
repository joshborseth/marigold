import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed, ShoppingCart } from "lucide-react";

interface ItemStatusProps {
  status: string;
  style?: "icon" | "badge";
}

export const ItemStatus = ({ status = "icon", style }: ItemStatusProps) => {
  const statusLower = status.toLowerCase();

  if (style === "icon") {
    switch (statusLower) {
      case "available":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "sold":
        return <ShoppingCart className="h-4 w-4 text-muted-foreground" />;
      case "pending":
        return <CircleDashed className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  }

  const variant =
    statusLower === "available"
      ? "success"
      : statusLower === "sold"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
};
