import { useEffect, useRef } from "react";

const RAPID_INPUT_DELAY = 200;

export const useBarcodeScanner = (
  onBarcodeScanned: (barcode: string) => void
) => {
  const lastKeyTimeRef = useRef<number>(0);
  const barcodeBufferRef = useRef<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Detect if this is rapid input (barcode scanner) or slow typing
      const isRapidInput = timeSinceLastKey < RAPID_INPUT_DELAY;

      // If not rapid input, clear buffer to start fresh (this is the first char of a new scan)
      if (!isRapidInput) {
        barcodeBufferRef.current = "";
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (barcodeBufferRef.current.length > 0) {
          onBarcodeScanned(barcodeBufferRef.current);
          barcodeBufferRef.current = "";
        }
        return;
      }

      barcodeBufferRef.current += e.key;
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
