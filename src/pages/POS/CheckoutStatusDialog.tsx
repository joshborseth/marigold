import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/Loader";
import { CircleCheck, XCircle, X } from "lucide-react";
import { SQUARE_CHECKOUT_STATUS } from "@/lib/constants";

interface CheckoutStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string | null | undefined;
  errorMessage?: string | null;
  isInitializing: boolean;
  onClose: () => void;
}

export const CheckoutStatusDialog = ({
  open,
  onOpenChange,
  status,
  errorMessage,
  isInitializing,
  onClose,
}: CheckoutStatusDialogProps) => {
  const isLoading =
    (isInitializing && !errorMessage) ||
    status === SQUARE_CHECKOUT_STATUS.PENDING ||
    status === SQUARE_CHECKOUT_STATUS.IN_PROGRESS;

  const isSuccess = status === SQUARE_CHECKOUT_STATUS.COMPLETED;
  const isError =
    status === SQUARE_CHECKOUT_STATUS.CANCELED ||
    status === SQUARE_CHECKOUT_STATUS.FAILED ||
    (!isInitializing && errorMessage && !status);

  const getTitle = () => {
    if (!isInitializing && errorMessage && !status) {
      return "Checkout Failed";
    }
    if (isInitializing && !errorMessage) {
      return "Processing Payment";
    }
    if (isSuccess) {
      return "Payment Successful";
    }
    if (status === SQUARE_CHECKOUT_STATUS.CANCELED) {
      return "Payment Canceled";
    }
    if (status === SQUARE_CHECKOUT_STATUS.FAILED) {
      return "Payment Failed";
    }
    return "Processing Payment";
  };

  const getDescription = () => {
    if (!isInitializing && errorMessage && !status) {
      return `Checkout failed: ${errorMessage}`;
    }
    if (isInitializing && !errorMessage) {
      return "Sending payment request to Square Terminal...";
    }
    if (status === SQUARE_CHECKOUT_STATUS.PENDING) {
      return "Payment request sent. Waiting for terminal response...";
    }
    if (status === SQUARE_CHECKOUT_STATUS.IN_PROGRESS) {
      return "Payment prompt sent to terminal! Please complete payment on the device.";
    }
    if (isSuccess) {
      return "Payment completed successfully!";
    }
    if (status === SQUARE_CHECKOUT_STATUS.CANCELED) {
      return "Payment was canceled. Please try again.";
    }
    if (status === SQUARE_CHECKOUT_STATUS.FAILED) {
      return `Payment failed: ${errorMessage || "Please try again."}`;
    }
    return "Processing payment...";
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing during loading states
        if (!isLoading) {
          onOpenChange(open);
          if (!open) {
            onClose();
          }
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        {!isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => {
              onOpenChange(false);
              onClose();
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            {isLoading && <Loader size="sm" variant="spinner" />}
            {isSuccess && <CircleCheck className="h-5 w-5 text-green-600" />}
            {isError && <XCircle className="h-5 w-5 text-red-600" />}
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isError && (
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
