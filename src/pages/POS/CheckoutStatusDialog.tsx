import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/Loader";
import { CircleCheck, XCircle } from "lucide-react";
import { SQUARE_CHECKOUT_STATUS } from "@/lib/constants";

interface CheckoutStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string | null | undefined;
  errorMessage?: string | null;
  onClose: () => void;
}

export const CheckoutStatusDialog = ({
  open,
  onOpenChange,
  status,
  errorMessage,
  onClose,
}: CheckoutStatusDialogProps) => {
  const getStatusText = () => {
    switch (status) {
      case SQUARE_CHECKOUT_STATUS.COMPLETED:
        return {
          title: "Checkout successful",
          description: "Checkout completed successfully!",
        };
      case SQUARE_CHECKOUT_STATUS.CANCELED:
        return {
          title: "Checkout canceled",
          description: "Checkout was canceled. Please try again.",
        };
      case SQUARE_CHECKOUT_STATUS.FAILED:
        return {
          title: "Checkout failed",
          description: `Checkout failed: ${errorMessage || "Please try again."}`,
        };
      case SQUARE_CHECKOUT_STATUS.PENDING:
        return {
          title: "Checkout pending",
          description:
            "The checkout has been created, and is being sent to the terminal.",
        };
      case SQUARE_CHECKOUT_STATUS.IN_PROGRESS:
        return {
          title: "Checkout in progress",
          description:
            "The checkout is active on the terminal, and the system is waiting for the customer to complete the payment.",
        };
      default:
        return {
          title: "Checkout status unknown",
          description: "Checkout status unknown",
        };
    }
  };

  const isError =
    status === SQUARE_CHECKOUT_STATUS.CANCELED ||
    status === SQUARE_CHECKOUT_STATUS.FAILED;
  const isLoading =
    status === SQUARE_CHECKOUT_STATUS.PENDING ||
    status === SQUARE_CHECKOUT_STATUS.IN_PROGRESS;
  const isSuccess = status === SQUARE_CHECKOUT_STATUS.COMPLETED;
  const isFinished = isError || isSuccess;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="h-1/4 w-1/2">
        <div className="p-10 flex gap-6 flex-col justify-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex justify-center gap-3 items-center text-center">
              {isLoading && <Loader size="sm" variant="spinner" />}
              {isSuccess && <CircleCheck className="h-5 w-5 text-success" />}
              {isError && <XCircle className="h-5 w-5 text-destructive" />}
              {getStatusText().title}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-center">
              {getStatusText().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isFinished && (
            <AlertDialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </AlertDialogFooter>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
