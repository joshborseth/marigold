import { useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { PageWrapper } from "@/components/PageWrapper";
import { api } from "../../../convex/_generated/api";
import { SquareIntegrationRequired } from "./SquareIntegrationRequired";
import { POSLoadingState } from "./POSLoadingState";
import { ItemSearch } from "./ItemSearch";
import { OrderItemsTable } from "./OrderItemsTable";
import { CheckoutFooter } from "./CheckoutFooter";
import { CheckoutStatusDialog } from "./CheckoutStatusDialog";

export const POSPage = () => {
  const squareIntegration = useQuery(api.square.squareOAuth.getSquareIntegration);

  if (squareIntegration === undefined) {
    return <POSLoadingState />;
  }

  if (squareIntegration === null) {
    return <SquareIntegrationRequired />;
  }

  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <ItemSearch />
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6">
          <div className="flex-1 overflow-auto">
            <OrderItemsTable />
          </div>
        </CardContent>
        <CheckoutFooter />
      </Card>
      <CheckoutStatusDialog />
    </PageWrapper>
  );
};
