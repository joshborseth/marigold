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
