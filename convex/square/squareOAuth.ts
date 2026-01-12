import { v } from "convex/values";
import {
  mutation,
  query,
  httpAction,
  internalMutation,
} from "../_generated/server";
import { internal } from "../_generated/api";
import {
  SQUARE_APPLICATION_ID,
  SQUARE_APPLICATION_SECRET,
  SQUARE_ENVIRONMENT,
} from "./constants";
import { SQUARE_BASE_URL, SQUARE_VERSION } from "./constants";

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

    const convexUrl = process.env.CONVEX_URL || process.env.CONVEX_SITE_URL;
    if (!convexUrl) {
      throw new Error(
        "CONVEX_URL or CONVEX_SITE_URL environment variable is not configured"
      );
    }

    const userId = identity.subject;
    const redirectUri = `${convexUrl}/api/square/callback`;
    const state = `${userId}-${Date.now()}`;

    const authUrl = new URL(`${SQUARE_BASE_URL}/oauth2/authorize`);
    authUrl.searchParams.set("client_id", SQUARE_APPLICATION_ID);
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

    return {
      authUrl: authUrl.toString(),
    };
  },
});

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

    const isExpired =
      integration.expiresAt && integration.expiresAt < Date.now();

    return {
      integrationEnabled: true,
      merchantId: integration.merchantId,
      connectedAt: integration.connectedAt,
      isExpired,
    };
  },
});

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

export const handleSquareCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
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
    const redirectUri = `${process.env.CONVEX_URL}/api/square/callback`;

    const tokenUrl = `${SQUARE_BASE_URL}/oauth2/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": SQUARE_VERSION,
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
    const expiresAt = tokenData.expires_at
      ? new Date(tokenData.expires_at).getTime()
      : undefined;

    await ctx.runMutation(internal.square.squareOAuth.upsertSquareIntegration, {
      userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      merchantId: tokenData.merchant_id,
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

export const upsertSquareIntegration = internalMutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    merchantId: v.optional(v.string()),
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
        connectedAt: args.connectedAt,
      });
    } else {
      await ctx.db.insert("squareIntegrations", args);
    }
  },
});
