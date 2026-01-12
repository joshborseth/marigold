import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { centsToDollars } from "@/lib/utils";

interface CheckoutFooterProps {
  total: number; // in cents
  onCheckout: () => void;
  isProcessingPayment: boolean;
  hasItems: boolean;
  currentCheckoutId?: string | null;
}

export const CheckoutFooter = ({
  total,
  onCheckout,
  isProcessingPayment,
  hasItems,
  currentCheckoutId,
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
            <Button
              size="lg"
              onClick={onCheckout}
              disabled={!hasItems || isProcessingPayment}
            >
              <CreditCard />
              Checkout
            </Button>
          </div>
        </div>
        {isProcessingPayment && currentCheckoutId && (
          <div className="text-sm text-muted-foreground">
            Waiting for payment on terminal...
          </div>
        )}
      </div>
    </CardFooter>
  );
};
