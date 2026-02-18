import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { calculateOrderTotal, centsToDollars } from "@/lib/utils";
import { DeviceSelector } from "./DeviceSelector";
import { usePOSContext } from "@/contexts";

export const CheckoutFooter = () => {
  const { orderItems, selectedDeviceId, handleCheckout } = usePOSContext();
  const total = calculateOrderTotal(orderItems);
  const hasItems = orderItems.length > 0;
  const totalInDollars = centsToDollars(total);

  return (
    <CardFooter className="border-t">
      <div className="flex flex-col gap-4 w-full py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Total: ${totalInDollars.toFixed(2)}
          </h2>
          <div className="flex items-center gap-4">
            <DeviceSelector />
            <Button
              size="lg"
              onClick={() => void handleCheckout(selectedDeviceId)}
              disabled={!hasItems || !selectedDeviceId}
            >
              <CreditCard />
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </CardFooter>
  );
};
