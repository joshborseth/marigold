import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleSquareCallback } from "./square/squareOAuth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

// Square OAuth callback route
http.route({
  path: "/api/square/callback",
  method: "GET",
  handler: handleSquareCallback,
});

export default http;
