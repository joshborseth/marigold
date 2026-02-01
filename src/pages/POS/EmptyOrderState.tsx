export const EmptyOrderState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground text-lg mb-2">Ready to scan</p>
      <p className="text-sm text-muted-foreground">
        Scan a barcode or start adding items to begin
      </p>
    </div>
  );
};
