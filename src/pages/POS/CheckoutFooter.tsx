import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { centsToDollars } from "@/lib/utils";
import { DeviceSelector } from "./DeviceSelector";

interface CheckoutFooterProps {
  total: number; // in cents
  onCheckout: () => void;
  hasItems: boolean;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string | null) => void;
}

export const CheckoutFooter = ({
  total,
  onCheckout,
  hasItems,
  selectedDeviceId,
  onDeviceSelect,
}: CheckoutFooterProps) => {
  const totalInDollars = centsToDollars(total);
  return (
    <CardFooter className="border-t">
      <div className="flex flex-col gap-4 w-full py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            Total: ${totalInDollars.toFixed(2)}
          </h2>
          <div className="flex items-center gap-4">
            <DeviceSelector
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={onDeviceSelect}
            />
            <Button
              size="lg"
              onClick={onCheckout}
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
