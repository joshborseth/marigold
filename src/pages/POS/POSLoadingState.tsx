import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/Loader";
import { PageWrapper } from "@/components/PageWrapper";

export const POSLoadingState = () => {
  return (
    <PageWrapper
      title="Point of Sale"
      description="Scan barcodes or add items to process sales quickly and efficiently"
    >
      <Card className="flex flex-col h-full">
        <CardContent className="flex flex-col flex-1 p-6 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader />
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};


