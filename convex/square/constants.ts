import { SquareEnvironment } from "square";

export const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;
export const SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET;
export const SQUARE_ENVIRONMENT = (process.env.SQUARE_ENVIRONMENT ||
  "sandbox") as "sandbox" | "production";
export const SQUARE_BASE_URL =
  SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
export const SQUARE_VERSION = "2025-10-16";
export const SQUARE_WEBHOOK_SIGNATURE_KEY =
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
export const SQUARE_CHECKOUT_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  FAILED: "FAILED",
} as const;
export const SQUARE_WEBHOOK_EVENTS = {
  TERMINAL_CHECKOUT_UPDATED: "terminal.checkout.updated",
} as const;
