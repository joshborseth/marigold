import { useContext } from "react";
import { POSContext } from "./pos-context";

export const usePOSContext = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error("usePOSContext must be used within POSProvider");
  }
  return context;
};
