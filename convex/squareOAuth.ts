import { v } from "convex/values";
import { mutation, query, httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Square OAuth configuration
// These should be set in your Convex dashboard environment variables
const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID;
const SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET;
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || "sandbox"; // "sandbox" or "production"

const SQUARE_BASE_URL =
  SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

/**
 * Get the Square OAuth authorization URL
 */
export const getSquareAuthUrl = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!SQUARE_APPLICATION_ID) {
      throw new Error("SQUARE_APPLICATION_ID is not configured");
    }

    // Use Convex deployment URL for the callback - HTTP endpoints are served from Convex
    // The Convex deployment URL is available via CONVEX_URL or we can construct it
    const convexUrl = process.env.CONVEX_URL || process.env.CONVEX_SITE_URL;
    if (!convexUrl) {
      throw new Error(
        "CONVEX_URL or CONVEX_SITE_URL environment variable is not configured"
      );
    }

    const userId = identity.subject;
    // Convex HTTP endpoints are served from the Convex deployment URL
    const redirectUri = `${convexUrl}/api/square/callback`;
    const state = `${userId}-${Date.now()}`; // Include userId in state for verification

    const authUrl = new URL(`${SQUARE_BASE_URL}/oauth2/authorize`);
    authUrl.searchParams.set("client_id", SQUARE_APPLICATION_ID);
    // Square OAuth scopes - use standard scopes for Terminal API access
    // Note: Terminal API may not require a specific scope, but MERCHANT_PROFILE_READ is typically needed
    authUrl.searchParams.set(
      "scope",
      "MERCHANT_PROFILE_READ PAYMENTS_READ PAYMENTS_WRITE DEVICES_READ"
    );
    authUrl.searchParams.set(
      "session",
      SQUARE_ENVIRONMENT === "production" ? "false" : "true"
    );
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    console.log("Square OAuth URL generated:", {
      baseUrl: SQUARE_BASE_URL,
      redirectUri,
      convexUrl,
      hasClientId: !!SQUARE_APPLICATION_ID,
    });

    return {
      authUrl: authUrl.toString(),
      state,
      redirectUri, // Include for debugging
    };
  },
});

/**
 * Get Square integration status for the current user
 */
export const getSquareIntegration = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const userId = identity.subject;
    const integration = await ctx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!integration) {
      return null;
    }

    // Check if token is expired
    const isExpired =
      integration.expiresAt && integration.expiresAt < Date.now();

    return {
      connected: true,
      merchantId: integration.merchantId,
      environment: integration.environment,
      connectedAt: integration.connectedAt,
      isExpired,
    };
  },
});

/**
 * Disconnect Square integration
 */
export const disconnectSquare = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const integration = await ctx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (integration) {
      await ctx.db.delete(integration._id);
    }

    return { success: true };
  },
});

/**
 * HTTP action to handle Square OAuth callback
 */
export const handleSquareCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    // Check for sandbox test account error
    const errorMessage = errorDescription || error;
    if (
      errorMessage.includes("launch the seller test account") ||
      errorMessage.includes("seller test account")
    ) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${process.env.SITE_URL}/integrations?error=sandbox_account&message=${encodeURIComponent("To start the OAuth flow for a sandbox account, first launch the seller test account from the Developer Console.")}`,
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.SITE_URL}/integrations?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || error)}`,
      },
    });
  }

  if (!code || !state) {
    return new Response(
      JSON.stringify({ error: "Missing code or state parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Extract userId from state
  const [userId] = state.split("-");

  if (!SQUARE_APPLICATION_ID || !SQUARE_APPLICATION_SECRET) {
    return new Response(
      JSON.stringify({ error: "Square OAuth not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Exchange authorization code for access token
    // We need to reconstruct the redirect_uri to match what was used in the authorization request
    const convexUrl = process.env.CONVEX_URL || process.env.CONVEX_SITE_URL;
    if (!convexUrl) {
      return new Response(
        JSON.stringify({ error: "CONVEX_URL not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const redirectUri = `${convexUrl}/api/square/callback`;

    const tokenUrl = `${SQUARE_BASE_URL}/oauth2/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        client_id: SQUARE_APPLICATION_ID,
        client_secret: SQUARE_APPLICATION_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        JSON.stringify({ error: `Token exchange failed: ${errorText}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();

    // Store the integration in the database
    const expiresAt = tokenData.expires_at
      ? new Date(tokenData.expires_at).getTime()
      : undefined;

    // Check if integration already exists by querying the database
    // We'll use a helper mutation to handle the upsert logic
    await ctx.runMutation(api.squareOAuth.upsertSquareIntegration, {
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      merchantId: tokenData.merchant_id,
      environment: SQUARE_ENVIRONMENT,
      connectedAt: Date.now(),
    });

    // Redirect to integrations page
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${process.env.SITE_URL}/integrations?connected=true`,
      },
    });
  } catch (error) {
    console.error("Square OAuth callback error:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to process OAuth callback: ${error instanceof Error ? error.message : "Unknown error"}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Upsert Square integration (internal mutation for OAuth callback)
 */
export const upsertSquareIntegration = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    merchantId: v.optional(v.string()),
    environment: v.string(),
    connectedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existingIntegration = await ctx.db
      .query("squareIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingIntegration) {
      await ctx.db.patch(existingIntegration._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        merchantId: args.merchantId,
        environment: args.environment,
        connectedAt: args.connectedAt,
      });
    } else {
      await ctx.db.insert("squareIntegrations", args);
    }
  },
});
