import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { centsToDollars } from "@/lib/utils";

interface CheckoutFooterProps {
  total: number; // in cents
  onCheckout: () => void;
  hasItems: boolean;
}

export const CheckoutFooter = ({
  total,
  onCheckout,
  hasItems,
}: CheckoutFooterProps) => {
  const totalInDollars = centsToDollars(total);
  return (
    <CardFooter className="border-t">
      <div className="flex flex-col gap-4 w-full py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Total: ${totalInDollars.toFixed(2)}
          </h2>
          <div className="flex gap-2">
            <Button size="lg" onClick={onCheckout} disabled={!hasItems}>
              <CreditCard />
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </CardFooter>
  );
};
