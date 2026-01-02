import { Badge } from "@/components/ui/badge";

interface ItemStatusBadgeProps {
  status: string;
}

export default function ItemStatusBadge({ status }: ItemStatusBadgeProps) {
  const statusLower = status.toLowerCase();

  const variant =
    statusLower === "available"
      ? "success"
      : statusLower === "sold"
        ? "secondary"
        : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
