import { v } from "convex/values";
import { httpAction, internalMutation } from "../_generated/server";
import {
  SQUARE_WEBHOOK_SIGNATURE_KEY,
  SQUARE_CHECKOUT_STATUS,
  SQUARE_WEBHOOK_EVENTS,
} from "./constants";
import { z } from "zod";
import { internal } from "../_generated/api";

const CheckoutStatusSchema = z.enum(Object.values(SQUARE_CHECKOUT_STATUS));

const CheckoutSchema = z.object({
  id: z.string(),
  status: CheckoutStatusSchema,
  payment_id: z.string().optional(),
  error_message: z.string().optional(),
});

export const handleTerminalWebhook = httpAction(async (ctx, request) => {
  if (!SQUARE_WEBHOOK_SIGNATURE_KEY) {
    console.error("SQUARE_WEBHOOK_SIGNATURE_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Webhook signature key not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const signature = request.headers.get("x-square-hmacsha256-signature");
  if (!signature) {
    console.error("Missing webhook signature header");
    return new Response(
      JSON.stringify({ error: "Missing webhook signature" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const payload = await request.text();

  const notificationUrl = `${process.env.CONVEX_SITE_URL}/api/square/webhook`;
  // Verify signature using Node.js runtime action
  const isValid = await ctx.runAction(
    internal.square.webhookVerification.verifyWebhookSignature,
    {
      requestBody: payload,
      signatureHeader: signature,
      signatureKey: SQUARE_WEBHOOK_SIGNATURE_KEY,
      notificationUrl,
    }
  );

  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid webhook signature" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const webhookData = JSON.parse(payload);

    // Square webhooks can contain multiple events in an array or a single event
    const events = Array.isArray(webhookData.data)
      ? webhookData.data
      : webhookData.type
        ? [webhookData]
        : [];

    for (const event of events) {
      // Handle terminal.checkout.updated event
      if (event.type === SQUARE_WEBHOOK_EVENTS.TERMINAL_CHECKOUT_UPDATED) {
        // Extract checkout from various possible locations in the payload
        const rawCheckout =
          event.data?.object?.checkout ||
          event.data?.checkout ||
          event.checkout;

        if (!rawCheckout) {
          console.error("Missing checkout data in webhook event");
          continue;
        }

        const checkoutResult = CheckoutSchema.safeParse(rawCheckout);

        if (!checkoutResult.success) {
          console.error("Invalid checkout data:", checkoutResult.error);
          continue;
        }

        const checkout = checkoutResult.data;
        const status = checkout.status;
        const completedAt =
          status === SQUARE_CHECKOUT_STATUS.COMPLETED ||
          status === SQUARE_CHECKOUT_STATUS.CANCELED ||
          status === SQUARE_CHECKOUT_STATUS.FAILED
            ? Date.now()
            : undefined;

        await ctx.runMutation(
          internal.square.squareWebhook.updateCheckoutStatus,
          {
            checkoutId: checkout.id,
            status,
            completedAt,
            paymentId: checkout.payment_id,
            errorMessage: checkout.error_message,
          }
        );
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: `Failed to process webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

export const updateCheckoutStatus = internalMutation({
  args: {
    checkoutId: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("IN_PROGRESS"),
      v.literal("COMPLETED"),
      v.literal("CANCELED"),
      v.literal("FAILED")
    ),
    completedAt: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkout = await ctx.db
      .query("squareTerminalCheckouts")
      .withIndex("by_checkout_id", (q) => q.eq("checkoutId", args.checkoutId))
      .first();

    if (!checkout) {
      throw new Error(`Checkout ${args.checkoutId} not found`);
    }
    console.log("Updating checkout status:", args);
    await ctx.db.patch(checkout._id, {
      status: args.status,
      completedAt: args.completedAt,
      paymentId: args.paymentId,
      errorMessage: args.errorMessage,
    });
  },
});
