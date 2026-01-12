"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { WebhooksHelper } from "square";

/**
 * Verifies a Square webhook signature using Node.js crypto APIs.
 * This runs as an internalAction in the Node.js runtime.
 */
export const verifyWebhookSignature = internalAction({
  args: {
    requestBody: v.string(),
    signatureHeader: v.string(),
    signatureKey: v.string(),
    notificationUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    return await WebhooksHelper.verifySignature({
      requestBody: args.requestBody,
      signatureHeader: args.signatureHeader,
      signatureKey: args.signatureKey,
      notificationUrl: args.notificationUrl,
    });
  },
});
