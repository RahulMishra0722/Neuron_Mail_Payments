import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as a string
    const rawBody = await req.text();

    // Parse the body
    const body = JSON.parse(rawBody);
    const signatureHeader = req.headers.get("paddle-signature");

    // Verify webhook signature - use the raw body string for verification
    if (!verifyPaddleSignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Create a service-level Supabase client instead of using the auth client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
    } else {
      console.log("All users from Supabase:", users);
    }
    // Log the webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("webhook_events")
      .insert({
        event_type: body.event_type,
        event_id: body.event_id,
        payload: body,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error("Error logging webhook event:", webhookError);
      return NextResponse.json(
        { error: "Error logging webhook event" },
        { status: 500 }
      );
    }

    // Process the webhook based on event type
    switch (body.event_type) {
      case "subscription.created":
        await handleSubscriptionCreated(body, supabase);
        break;
      case "subscription.updated":
        await handleSubscriptionUpdated(body, supabase);
        break;
      case "subscription.canceled":
        await handleSubscriptionCanceled(body, supabase);
        break;
      case "transaction.completed":
        console.log(
          `Event type hook ${body.event_type} eventBody:${JSON.stringify(body)}`
        );
        await handlePaymentSucceeded(body, supabase);
        break;
      case "transaction.failed":
        await handlePaymentFailed(body, supabase);
        break;
      default:
        console.log(`Unhandled webhook event: ${body.event_type}`);
    }

    // Mark webhook as processed
    await supabase
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", webhookEvent.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifyPaddleSignature(
  payload: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !config.paddle.webhookSecret) {
    console.error("Missing signature header or webhook secret");
    return false;
  }

  try {
    // Parse the signature header
    const signatureParts: Record<string, string> = {};
    signatureHeader.split(";").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        signatureParts[key] = value;
      }
    });

    // Check if we have the h1 signature and timestamp
    if (!signatureParts.h1 || !signatureParts.ts) {
      console.error("Missing h1 signature or timestamp in header");
      return false;
    }

    // Compute our own signature - use timestamp + payload format
    const dataToSign = `${signatureParts.ts}:${payload}`;
    const hmac = crypto.createHmac("sha256", config.paddle.webhookSecret);
    const digest = hmac.update(dataToSign).digest("hex");

    // Compare signatures
    return digest === signatureParts.h1;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Handle subscription created event
async function handleSubscriptionCreated(event: any, supabase: any) {
  const { customer, subscription } = event.data;

  // Find user by email
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("email", customer.email)
    .single();

  if (!userData) {
    console.error(`User not found for email: ${customer.email}`);
    return;
  }
  console.log({ userData });

  // Create subscription record
  await supabase.from("subscriptions").insert({
    user_id: userData.id,
    paddle_subscription_id: subscription.id,
    paddle_customer_id: customer.id,
    status: subscription.status,
    plan_id: subscription.items[0].price.product_id,
    current_period_start: subscription.current_period.starts_at,
    current_period_end: subscription.current_period.ends_at,
  });
}

// Handle subscription updated event
async function handleSubscriptionUpdated(event: any, supabase: any) {
  const { subscription } = event.data;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("paddle_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period.starts_at,
      current_period_end: subscription.current_period.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingSubscription.id);
}

// Handle subscription canceled event
async function handleSubscriptionCanceled(event: any, supabase: any) {
  const { subscription } = event.data;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingSubscription.id);
}

// Handle payment succeeded event
async function handlePaymentSucceeded(event: any, supabase: any) {
  const { subscription } = event.data;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period.starts_at,
      current_period_end: subscription.current_period.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingSubscription.id);
}

// Handle payment failed event
async function handlePaymentFailed(event: any, supabase: any) {
  const { subscription } = event.data;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.error(`Subscription not found: ${subscription.id}`);
    return;
  }

  // Update subscription record
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingSubscription.id);
}
