import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader } from "@/components/Loader";
import { CircleCheck, XCircle } from "lucide-react";
import { SQUARE_CHECKOUT_STATUS } from "@/lib/constants";
import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

interface CheckoutStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutStatus:
    | FunctionReturnType<typeof api.square.square.getCheckoutStatus>
    | undefined;
  onClose: () => void;
  requestingCheckout: boolean;
}

export const CheckoutStatusDialog = ({
  open,
  onOpenChange,
  checkoutStatus,
  onClose,
  requestingCheckout,
}: CheckoutStatusDialogProps) => {
  const status = checkoutStatus?.status;
  const getStatusText = () => {
    if (requestingCheckout) {
      return {
        title: "Checkout request initiated",
        description: "The checkout request is being sent to the server.",
      };
    }
    if (!status)
      return {
        title: "Checkout loading",
        description: "The checkout response is being loaded from the server.",
      };
    switch (status) {
      case SQUARE_CHECKOUT_STATUS.COMPLETED:
        return {
          title: "Checkout successful",
          description:
            "The payment was successfully completed, and the terminal checkout is finished.",
        };
      case SQUARE_CHECKOUT_STATUS.CANCELED:
        return {
          title: "Checkout canceled",
          description: "Checkout was canceled. Please try again.",
        };
      case SQUARE_CHECKOUT_STATUS.FAILED:
        return {
          title: "Checkout failed",
          description: `Checkout failed. ${checkoutStatus.errorMessage || "Please try again."}`,
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
          description: "The checkout status is unknown.",
        };
    }
  };

  const isError =
    status === SQUARE_CHECKOUT_STATUS.CANCELED ||
    status === SQUARE_CHECKOUT_STATUS.FAILED;
  const isLoading =
    status === SQUARE_CHECKOUT_STATUS.PENDING ||
    status === SQUARE_CHECKOUT_STATUS.IN_PROGRESS ||
    requestingCheckout ||
    !status;
  const isSuccess = status === SQUARE_CHECKOUT_STATUS.COMPLETED;
  const isFinished = isError || isSuccess;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (isLoading) return;
        if (!open) {
          return onClose();
        }
        return onOpenChange(open);
      }}
    >
      <AlertDialogContent className="h-1/4 w-1/2 flex flex-col justify-center items-center">
        <div className="p-10">
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
            <AlertDialogFooter className="pt-6">
              <AlertDialogCancel className="w-full" onClick={onClose}>
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
