import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleSquareCallback } from "./square/squareOAuth";
import { handleTerminalWebhook } from "./square/squareWebhook";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

// Square OAuth callback route
http.route({
  path: "/api/square/callback",
  method: "GET",
  handler: handleSquareCallback,
});

// Square Terminal webhook route
http.route({
  path: "/api/square/webhook",
  method: "POST",
  handler: handleTerminalWebhook,
});

export default http;
