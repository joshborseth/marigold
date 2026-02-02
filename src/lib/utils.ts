import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SQUARE_CHECKOUT_STATUS } from "./constants";
export { SQUARE_CHECKOUT_STATUS };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert cents to dollars for display.
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as a currency string (e.g., "$19.99").
 */
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(centsToDollars(amountInCents));
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
