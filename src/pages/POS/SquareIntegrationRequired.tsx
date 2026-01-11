import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";

export const SquareIntegrationRequired = () => {
  const navigate = useNavigate();

  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6 items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <XCircle className="h-16 w-16 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Square Account Required</h2>
              <p className="text-muted-foreground">
                To use the Point of Sale system, you need to connect your Square
                account. This enables payment processing through Square
                Terminal.
              </p>
            </div>
            <Button
              size="lg"
              className="mt-4"
              onClick={() => navigate("/integrations")}
            >
              Connect Square Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};


