import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";

// Define subscription states based on Paddle's status
type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

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

    console.log(
      `Event type hook ${body.event_type} eventBody:${JSON.stringify(body)}`
    );

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
      case "subscription.trialing":
        await handleSubscriptionTrialing(body, supabase);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(body, supabase);
        break;
      case "transaction.updated":
        await handleTransactionUpdated(body, supabase);
        break;
      case "transaction.failed":
        await handleTransactionFailed(body, supabase);
        break;
      case "payment_method.deleted":
        // Just log it, no need to process
        console.log("Payment method deleted, no further action needed");
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

// Enhanced helper function to get user ID from event data with better logging
function getUserIdFromEvent(eventData: any): string | null {
  // Log the structure to better understand what we're dealing with
  console.log(
    "Event custom_data structure:",
    JSON.stringify(eventData.custom_data, null, 2)
  );

  // Primary search locations in order of preference
  const locations = [
    // Direct custom_data
    eventData.custom_data?.userId,
    eventData.custom_data?.user_id,

    // Check nested within subscription
    eventData.subscription?.custom_data?.userId,
    eventData.subscription?.custom_data?.user_id,

    // Check customer metadata
    eventData.customer?.custom_data?.userId,
    eventData.customer?.custom_data?.user_id,

    // Check passthrough data if using older style
    eventData.passthrough?.userId,
    eventData.passthrough?.user_id,
  ];

  // Find the first non-null value
  for (const location of locations) {
    if (location) {
      console.log(`Found userId: ${location}`);
      return location;
    }
  }

  console.error(
    "No user ID found in event data. Full event data structure:",
    JSON.stringify(eventData, null, 2)
  );
  return null;
}

// Helper function to update user subscription status
async function updateUserSubscriptionStatus(
  userId: string,
  status: SubscriptionStatus,
  supabase: any
) {
  try {
    console.log(`Updating user ${userId} subscription status to: ${status}`);

    // Update the user's subscription status in the users table
    const { error } = await supabase
      .from("users")
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error(
        `Error updating user subscription status: ${error.message}`
      );
    } else {
      console.log(
        `Successfully updated user ${userId} subscription status to ${status}`
      );
    }
  } catch (error) {
    console.error("Error updating user subscription status:", error);
  }
}

// Extract billing details from subscription data
function extractBillingDetails(data: any) {
  const firstItem = data.items?.[0] || {};
  const price = firstItem.price || {};
  const product = firstItem.product || {};
  const billingCycle = data.billing_cycle || {};
  const trialDates = firstItem.trial_dates || {};

  return {
    price_name: price.name,
    price_amount: price.unit_price?.amount,
    product_name: product.name,
    currency_code: data.currency_code || price.unit_price?.currency_code,
    collection_mode: data.collection_mode,
    billing_interval: billingCycle.interval,
    billing_frequency: billingCycle.frequency,
    trial_start: trialDates.starts_at,
    trial_end: trialDates.ends_at,
    next_billed_at: data.next_billed_at,
    first_billed_at: data.first_billed_at,
    paddle_transaction_id: data.transaction_id,
  };
}

// Handle subscription created event
async function handleSubscriptionCreated(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(subscriptionData);

  if (!userId) {
    console.error("User ID not found in subscription.created event");
    return;
  }

  console.log(`Processing subscription.created for user: ${userId}`);

  // Determine subscription status - this is now at the root level of subscription data
  const status = subscriptionData.status as SubscriptionStatus;

  if (!status) {
    console.error(
      "Subscription status not found in event data:",
      subscriptionData
    );
    return;
  }

  // Extract billing details
  const billingDetails = extractBillingDetails(subscriptionData);

  // Create subscription record
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      paddle_subscription_id: subscriptionData.id,
      paddle_customer_id: subscriptionData.customer_id,
      status: status,
      plan_id: subscriptionData.items[0]?.price?.product_id,
      current_period_start: subscriptionData.current_billing_period?.starts_at,
      current_period_end: subscriptionData.current_billing_period?.ends_at,
      next_billed_at: billingDetails.next_billed_at,
      first_billed_at: billingDetails.first_billed_at,
      collection_mode: billingDetails.collection_mode,
      currency_code: billingDetails.currency_code,
      price_amount: billingDetails.price_amount,
      price_name: billingDetails.price_name,
      product_name: billingDetails.product_name,
      trial_start: billingDetails.trial_start,
      trial_end: billingDetails.trial_end,
      billing_interval: billingDetails.billing_interval,
      billing_frequency: billingDetails.billing_frequency,
      paddle_transaction_id: billingDetails.paddle_transaction_id,
      last_webhook_event: "subscription.created",
    });

  if (subscriptionError) {
    console.error(`Error creating subscription: ${subscriptionError.message}`);
    return;
  }

  // Update user subscription status
  await updateUserSubscriptionStatus(userId, status, supabase);
}

// Handle subscription trialing event
async function handleSubscriptionTrialing(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(subscriptionData);

  if (!userId) {
    console.error("User ID not found in subscription.trialing event");
    return;
  }

  console.log(`Processing subscription.trialing for user: ${userId}`);

  // Find existing subscription
  const { data: existingSubscription, error: findError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscriptionData.id)
    .single();

  if (findError) {
    // If subscription doesn't exist, create it
    if (findError.code === "PGRST116") {
      console.log(
        `Subscription not found, creating new record for trial: ${subscriptionData.id}`
      );
      return await handleSubscriptionCreated(event, supabase);
    }

    console.error(`Error finding subscription: ${findError.message}`);
    return;
  }

  // Extract billing details
  const billingDetails = extractBillingDetails(subscriptionData);

  // Update subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "trialing",
      trial_start: billingDetails.trial_start,
      trial_end: billingDetails.trial_end,
      next_billed_at: billingDetails.next_billed_at,
      current_period_start: subscriptionData.current_billing_period?.starts_at,
      current_period_end: subscriptionData.current_billing_period?.ends_at,
      updated_at: new Date().toISOString(),
      last_webhook_event: "subscription.trialing",
    })
    .eq("id", existingSubscription.id);

  if (updateError) {
    console.error(`Error updating subscription: ${updateError.message}`);
    return;
  }

  // Update user subscription status
  await updateUserSubscriptionStatus(userId, "trialing", supabase);
}

// Handle subscription updated event
async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(subscriptionData);

  if (!userId) {
    console.error("User ID not found in subscription.updated event");
    return;
  }

  console.log(`Processing subscription.updated for user: ${userId}`);

  // Find existing subscription
  const { data: existingSubscription, error: findError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscriptionData.id)
    .single();

  if (findError) {
    console.error(`Subscription not found: ${findError.message}`);
    return;
  }

  // Determine subscription status
  const status = subscriptionData.status as SubscriptionStatus;

  // Extract billing details
  const billingDetails = extractBillingDetails(subscriptionData);

  // Update subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: status,
      current_period_start: subscriptionData.current_billing_period?.starts_at,
      current_period_end: subscriptionData.current_billing_period?.ends_at,
      next_billed_at: billingDetails.next_billed_at,
      collection_mode: billingDetails.collection_mode,
      currency_code: billingDetails.currency_code,
      price_amount: billingDetails.price_amount,
      price_name: billingDetails.price_name,
      product_name: billingDetails.product_name,
      trial_start: billingDetails.trial_start,
      trial_end: billingDetails.trial_end,
      billing_interval: billingDetails.billing_interval,
      billing_frequency: billingDetails.billing_frequency,
      updated_at: new Date().toISOString(),
      last_webhook_event: "subscription.updated",
    })
    .eq("id", existingSubscription.id);

  if (updateError) {
    console.error(`Error updating subscription: ${updateError.message}`);
    return;
  }

  // Update user subscription status
  await updateUserSubscriptionStatus(userId, status, supabase);
}

// Handle subscription canceled event
async function handleSubscriptionCanceled(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(subscriptionData);

  if (!userId) {
    console.error("User ID not found in subscription.canceled event");
    return;
  }

  console.log(`Processing subscription.canceled for user: ${userId}`);

  // Find existing subscription
  const { data: existingSubscription, error: findError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscriptionData.id)
    .single();

  if (findError) {
    console.error(`Subscription not found: ${findError.message}`);
    return;
  }

  // Update subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: subscriptionData.canceled_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_webhook_event: "subscription.canceled",
    })
    .eq("id", existingSubscription.id);

  if (updateError) {
    console.error(`Error updating subscription: ${updateError.message}`);
    return;
  }

  // Update user subscription status
  await updateUserSubscriptionStatus(userId, "canceled", supabase);
}

// Handle transaction completed event
async function handleTransactionCompleted(event: any, supabase: any) {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(transactionData);

  if (!userId) {
    console.error("User ID not found in transaction.completed event");
    return;
  }

  console.log(`Processing transaction.completed for user: ${userId}`);

  // Extract subscription ID if available
  const subscriptionId = transactionData.subscription_id;

  if (!subscriptionId) {
    console.log("No subscription ID in transaction.completed event");
  }

  // Find the subscription in our database if it exists
  let subscriptionRecord = null;
  if (subscriptionId) {
    const { data: existingSubscription, error: findError } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("paddle_subscription_id", subscriptionId)
      .single();

    if (!findError) {
      subscriptionRecord = existingSubscription;
    }
  }

  // Extract payment details
  const payment = transactionData.payments?.[0] || {};
  const methodDetails = payment.method_details || {};
  const cardDetails = methodDetails.card || {};
  const paymentMethod = methodDetails.type
    ? `${methodDetails.type} (${cardDetails.type || ""} ending in ${
        cardDetails.last4 || ""
      })`
    : "unknown";

  // Record the transaction
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      subscription_id: subscriptionRecord?.id,
      paddle_transaction_id: transactionData.id,
      amount: transactionData.details?.totals?.total || 0,
      currency:
        transactionData.currency_code ||
        transactionData.details?.totals?.currency_code,
      status: transactionData.status,
      created_at: transactionData.created_at || new Date().toISOString(),
      currency_code: transactionData.currency_code,
      payment_method: paymentMethod,
      invoice_id: transactionData.invoice_id,
      billing_period_start: transactionData.billing_period?.starts_at,
      billing_period_end: transactionData.billing_period?.ends_at,
    });

  if (transactionError) {
    console.error(`Error recording transaction: ${transactionError.message}`);
    return;
  }

  // If there's an associated subscription, update it with the transaction ID
  if (subscriptionRecord) {
    await supabase
      .from("subscriptions")
      .update({
        paddle_transaction_id: transactionData.id,
        updated_at: new Date().toISOString(),
        last_webhook_event: "transaction.completed",
      })
      .eq("id", subscriptionRecord.id);
  }

  // If we have a subscription status, update the user's status
  if (subscriptionRecord?.status) {
    await updateUserSubscriptionStatus(
      userId,
      subscriptionRecord.status,
      supabase
    );
  }
}

// Handle transaction updated event
async function handleTransactionUpdated(event: any, supabase: any) {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(transactionData);

  if (!userId) {
    console.error("User ID not found in transaction.updated event");
    return;
  }

  console.log(`Processing transaction.updated for user: ${userId}`);

  // Find existing transaction
  const { data: existingTransaction, error: findError } = await supabase
    .from("transactions")
    .select("id")
    .eq("paddle_transaction_id", transactionData.id)
    .single();

  if (findError) {
    // If transaction doesn't exist, create it
    if (findError.code === "PGRST116") {
      console.log(
        `Transaction not found, creating new record: ${transactionData.id}`
      );
      return await handleTransactionCompleted(event, supabase);
    }

    console.error(`Error finding transaction: ${findError.message}`);
    return;
  }

  // Extract payment details
  const payment = transactionData.payments?.[0] || {};
  const methodDetails = payment.method_details || {};
  const paymentMethod = methodDetails.type || "unknown";

  // Update transaction record
  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status: transactionData.status,
      amount: transactionData.details?.totals?.total || 0,
      currency:
        transactionData.currency_code ||
        transactionData.details?.totals?.currency_code,
      payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingTransaction.id);

  if (updateError) {
    console.error(`Error updating transaction: ${updateError.message}`);
  }
}

// Handle transaction failed event
async function handleTransactionFailed(event: any, supabase: any) {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(transactionData);
  const subscriptionId = transactionData.subscription_id;

  if (!userId) {
    console.error("User ID not found in transaction.failed event");
    return;
  }

  console.log(`Processing transaction.failed for user: ${userId}`);

  // Find the subscription in our database if it exists
  let subscriptionRecord = null;
  if (subscriptionId) {
    const { data: existingSubscription, error: findError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("paddle_subscription_id", subscriptionId)
      .single();

    if (!findError) {
      subscriptionRecord = existingSubscription;
    }
  }

  // Extract payment details
  const payment = transactionData.payments?.[0] || {};
  const methodDetails = payment.method_details || {};
  const paymentMethod = methodDetails.type || "unknown";

  // Record the transaction
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      subscription_id: subscriptionRecord?.id,
      paddle_transaction_id: transactionData.id,
      amount: transactionData.details?.totals?.total || 0,
      currency:
        transactionData.currency_code ||
        transactionData.details?.totals?.currency_code,
      status: "failed",
      created_at: transactionData.created_at || new Date().toISOString(),
      currency_code: transactionData.currency_code,
      payment_method: paymentMethod,
      invoice_id: transactionData.invoice_id,
      billing_period_start: transactionData.billing_period?.starts_at,
      billing_period_end: transactionData.billing_period?.ends_at,
    });

  if (transactionError) {
    console.error(
      `Error recording failed transaction: ${transactionError.message}`
    );
  }

  // If there's an associated subscription, update its status to past_due
  if (subscriptionRecord) {
    await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
        last_webhook_event: "transaction.failed",
      })
      .eq("id", subscriptionRecord.id);

    // Update user subscription status
    await updateUserSubscriptionStatus(userId, "past_due", supabase);
  }
}
