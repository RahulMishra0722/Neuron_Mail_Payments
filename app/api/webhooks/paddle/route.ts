import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";

type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const body = JSON.parse(rawBody);
    const signatureHeader = req.headers.get("paddle-signature");

    // Verify webhook signature - use the raw body string for verification
    if (!verifyPaddleSignature(rawBody, signatureHeader)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Create a service-level Supabase client instead of using the auth client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ""
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

// Fix the getUserIdFromEvent function to better handle nested data structures
function getUserIdFromEvent(eventData: any): string | null {
  // Access custom_data directly from the data object which is the standard structure in Paddle webhooks
  const customData = eventData.data?.custom_data || eventData.custom_data || {};

  // Log the structure to better understand what we're dealing with
  console.log(
    "Event custom_data structure:",
    JSON.stringify(customData, null, 2)
  );

  // Get userId with fallbacks
  const userId = customData.userId || customData.user_id || null;

  if (userId) {
    console.log(`Found userId: ${userId}`);
    return userId;
  }

  // If not found in primary location, check other possible locations
  const secondaryLocations = [
    // Check nested within subscription
    eventData.data?.subscription?.custom_data?.userId,
    eventData.data?.subscription?.custom_data?.user_id,
    eventData.subscription?.custom_data?.userId,
    eventData.subscription?.custom_data?.user_id,

    // Check customer metadata
    eventData.data?.customer?.custom_data?.userId,
    eventData.data?.customer?.custom_data?.user_id,
    eventData.customer?.custom_data?.userId,
    eventData.customer?.custom_data?.user_id,

    // Check passthrough data if using older style
    eventData.data?.passthrough?.userId,
    eventData.data?.passthrough?.user_id,
    eventData.passthrough?.userId,
    eventData.passthrough?.user_id,
  ];

  // Find the first non-null value
  for (const location of secondaryLocations) {
    if (location) {
      console.log(`Found userId: ${location}`);
      return location;
    }
  }

  console.error("No user ID found in event data");
  return null;
}

// Fix the extractBillingDetails function to properly handle nested data
function extractBillingDetails(data: any) {
  // Make sure we're accessing the right level of data
  const eventData = data.data || data;

  // Get the first item with proper fallbacks
  const items = eventData.items || [];
  const firstItem = items[0] || {};

  // Extract price and product info with fallbacks
  const price = firstItem.price || {};
  const product = firstItem.product || {};

  // Get billing cycle and trial dates with fallbacks
  const billingCycle = eventData.billing_cycle || {};
  const trialDates = firstItem.trial_dates || {};

  // Extract unit price with proper fallbacks
  const unitPrice = price.unit_price || {};
  const priceAmount = unitPrice.amount || null;
  const currencyCode =
    eventData.currency_code || unitPrice.currency_code || null;

  return {
    price_name: price.name || null,
    price_amount: priceAmount,
    product_name: product.name || null,
    currency_code: currencyCode,
    collection_mode: eventData.collection_mode || null,
    billing_interval: billingCycle.interval || null,
    billing_frequency: billingCycle.frequency || null,
    trial_start: trialDates.starts_at || null,
    trial_end: trialDates.ends_at || null,
    next_billed_at: eventData.next_billed_at || null,
    first_billed_at: eventData.first_billed_at || null,
    paddle_transaction_id: eventData.transaction_id || null,
  };
}

// Fix the handleTransactionUpdated function to properly handle data access
async function handleTransactionUpdated(event: any, supabase: any) {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(event);

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

  // Extract payment details with proper fallbacks
  const payments = transactionData.payments || [];
  const payment = payments[0] || {};
  const methodDetails = payment.method_details || {};
  const cardDetails = methodDetails.card || {};

  // Create a more robust payment method string
  const paymentMethod = methodDetails.type
    ? `${methodDetails.type}${
        cardDetails.type
          ? ` (${cardDetails.type}${
              cardDetails.last4 ? ` ending in ${cardDetails.last4}` : ""
            })`
          : ""
      }`
    : "unknown";

  // Extract totals with proper fallbacks
  const details = transactionData.details || {};
  const totals = details.totals || {};
  const total = totals.total || "0";
  const currencyCode =
    transactionData.currency_code || totals.currency_code || "USD";

  try {
    // Update transaction record - always include updated_at
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: transactionData.status || "unknown",
        amount: total,
        currency: currencyCode,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString(), // Always include this
      })
      .eq("id", existingTransaction.id);

    if (updateError) {
      console.error(`Error updating transaction: ${updateError.message}`);
    }
  } catch (error) {
    console.error(`Error updating transaction: ${error}`);
  }
}

// Fix the handleTransactionFailed function to properly handle data access
async function handleTransactionFailed(event: any, supabase: any) {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(event);
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

  // Check if transaction already exists to avoid duplicate key errors
  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id")
    .eq("paddle_transaction_id", transactionData.id)
    .single();

  if (existingTransaction) {
    console.log(
      `Transaction ${transactionData.id} already exists, updating instead of inserting`
    );
    // Update the status to failed
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingTransaction.id);
    return;
  }

  // Extract payment details with proper fallbacks
  const payments = transactionData.payments || [];
  const payment = payments[0] || {};
  const methodDetails = payment.method_details || {};
  const paymentMethod = methodDetails.type || "unknown";

  // Extract totals with proper fallbacks
  const details = transactionData.details || {};
  const totals = details.totals || {};
  const total = totals.total || "0";
  const currencyCode =
    transactionData.currency_code || totals.currency_code || "USD";

  // Extract billing period with proper fallbacks
  const billingPeriod = transactionData.billing_period || {};
  const billingPeriodStart = billingPeriod.starts_at || null;
  const billingPeriodEnd = billingPeriod.ends_at || null;

  // Record the transaction
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      subscription_id: subscriptionRecord?.id,
      paddle_transaction_id: transactionData.id,
      amount: total,
      currency: currencyCode,
      status: "failed",
      created_at: transactionData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(), // Add this to avoid schema issues
      currency_code: currencyCode,
      payment_method: paymentMethod,
      invoice_id: transactionData.invoice_id || null,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
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

// Fix the handleSubscriptionCreated function to properly handle data access
async function handleSubscriptionCreated(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(event);

  if (!userId) {
    console.error("User ID not found in subscription.created event");
    return;
  }

  console.log(`Processing subscription.created for user: ${userId}`);

  // Determine subscription status - this is now at the root level of subscription data
  const status = subscriptionData.status;

  if (!status) {
    console.error(
      "Subscription status not found in event data:",
      subscriptionData
    );
    return;
  }

  // Extract billing details with proper fallbacks
  const billingDetails = extractBillingDetails(subscriptionData);

  // Create subscription record
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      paddle_subscription_id: subscriptionData.id,
      paddle_customer_id: subscriptionData.customer_id,
      status: status,
      plan_id: subscriptionData.items?.[0]?.price?.product_id || null,
      current_period_start:
        subscriptionData.current_billing_period?.starts_at || null,
      current_period_end:
        subscriptionData.current_billing_period?.ends_at || null,
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
      created_at: subscriptionData.created_at || new Date().toISOString(),
      updated_at: subscriptionData.updated_at || new Date().toISOString(),
      last_webhook_event: "subscription.created",
    });

  if (subscriptionError) {
    console.error(`Error creating subscription: ${subscriptionError.message}`);
    return;
  }

  // Update user subscription status
  await updateUserSubscriptionStatus(userId, status, supabase);
}

// Fix the handleSubscriptionTrialing function to properly handle data access
async function handleSubscriptionTrialing(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(event);

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

  // Extract billing details with proper fallbacks
  const billingDetails = extractBillingDetails(subscriptionData);

  // Get trial dates with proper fallbacks
  const items = subscriptionData.items || [];
  const firstItem = items[0] || {};
  const trialDates = firstItem.trial_dates || {};

  // Update subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "trialing",
      trial_start: trialDates.starts_at || null,
      trial_end: trialDates.ends_at || null,
      next_billed_at: subscriptionData.next_billed_at || null,
      current_period_start:
        subscriptionData.current_billing_period?.starts_at || null,
      current_period_end:
        subscriptionData.current_billing_period?.ends_at || null,
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

// Fix the handleSubscriptionUpdated function to properly handle data access
async function handleSubscriptionUpdated(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(event);

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
    // If subscription doesn't exist, log the error and return
    console.error(`Error finding subscription: ${findError.message}`);
    return;
  }

  // Determine subscription status
  const status = subscriptionData.status;

  if (!status) {
    console.error(
      "Subscription status not found in event data:",
      subscriptionData
    );
    return;
  }

  // Extract billing details with proper fallbacks
  const billingDetails = extractBillingDetails(subscriptionData);

  // Update subscription record
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: status,
      plan_id: subscriptionData.items?.[0]?.price?.product_id || null,
      current_period_start:
        subscriptionData.current_billing_period?.starts_at || null,
      current_period_end:
        subscriptionData.current_billing_period?.ends_at || null,
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
      updated_at: subscriptionData.updated_at || new Date().toISOString(),
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

// Fix the handleSubscriptionCanceled function to properly handle data access
async function handleSubscriptionCanceled(event: any, supabase: any) {
  const subscriptionData = event.data;
  const userId = getUserIdFromEvent(event);

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
    // If subscription doesn't exist, log the error and return
    console.error(`Error finding subscription: ${findError.message}`);
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
// Replace your existing updateUserSubscriptionStatus function with this enhanced version
async function updateUserSubscriptionStatus(
  userId: string,
  status: string,
  supabase: any
) {
  try {
    // Determine subscription_active and is_on_free_trial based on status
    let subscription_active = false;
    let is_on_free_trial = false;

    switch (status) {
      case "active":
        subscription_active = true;
        is_on_free_trial = false;
        break;
      case "trialing":
        subscription_active = false; // Not paying yet
        is_on_free_trial = true;
        break;
      case "past_due":
        subscription_active = false; // Payment failed
        is_on_free_trial = false;
        break;
      case "paused":
        subscription_active = false; // Paused by user
        is_on_free_trial = false;
        break;
      case "canceled":
      case "expired":
        subscription_active = false;
        is_on_free_trial = false;
        break;
      default:
        // For unknown statuses, default to inactive
        subscription_active = false;
        is_on_free_trial = false;
        console.warn(`Unknown subscription status: ${status}`);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_active,
        is_on_free_trial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error.message);
    } else {
      console.log(
        `User ${userId} profile updated - subscription_active: ${subscription_active}, is_on_free_trial: ${is_on_free_trial}`
      );
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

// Also add this helper function to handle trial period detection more accurately
async function updateUserProfileForTrial(
  userId: string,
  subscriptionData: any,
  supabase: any
) {
  try {
    // Check if this is specifically a trial period
    const items = subscriptionData.items || [];
    const firstItem = items[0] || {};
    const trialDates = firstItem.trial_dates || {};

    const now = new Date();
    const trialStart = trialDates.starts_at
      ? new Date(trialDates.starts_at)
      : null;
    const trialEnd = trialDates.ends_at ? new Date(trialDates.ends_at) : null;

    // Determine if currently in trial period
    const isCurrentlyInTrial =
      trialStart && trialEnd ? now >= trialStart && now <= trialEnd : false;

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_active: false, // Not paying during trial
        is_on_free_trial: isCurrentlyInTrial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user trial status:", error.message);
    } else {
      console.log(
        `User ${userId} trial status updated - is_on_free_trial: ${isCurrentlyInTrial}`
      );
    }
  } catch (error) {
    console.error("Error updating user trial status:", error);
  }
}

// Also update handleTransactionCompleted to handle profile updates better
async function handleTransactionCompleted(
  event: any,
  supabase: any
): Promise<any> {
  const transactionData = event.data;
  const userId = getUserIdFromEvent(event);

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

  // Check if transaction already exists to avoid duplicate key errors
  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id")
    .eq("paddle_transaction_id", transactionData.id)
    .single();

  if (existingTransaction) {
    console.log(
      `Transaction ${transactionData.id} already exists, updating instead of inserting`
    );
    return await handleTransactionUpdated(event, supabase);
  }

  // Extract payment details with proper fallbacks
  const payments = transactionData.payments || [];
  const payment = payments[0] || {};
  const methodDetails = payment.method_details || {};
  const cardDetails = methodDetails.card || {};

  // Create a more robust payment method string
  const paymentMethod = methodDetails.type
    ? `${methodDetails.type}${
        cardDetails.type
          ? ` (${cardDetails.type}${
              cardDetails.last4 ? ` ending in ${cardDetails.last4}` : ""
            })`
          : ""
      }`
    : "unknown";

  // Extract totals with proper fallbacks
  const details = transactionData.details || {};
  const totals = details.totals || {};
  const total = totals.total || "0";
  const currencyCode =
    transactionData.currency_code || totals.currency_code || "USD";

  // Extract billing period with proper fallbacks
  const billingPeriod = transactionData.billing_period || {};
  const billingPeriodStart = billingPeriod.starts_at || null;
  const billingPeriodEnd = billingPeriod.ends_at || null;

  // Record the transaction - include updated_at to avoid schema issues
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      subscription_id: subscriptionRecord?.id,
      paddle_transaction_id: transactionData.id,
      amount: total,
      currency: currencyCode,
      status: transactionData.status || "unknown",
      created_at: transactionData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      currency_code: currencyCode,
      payment_method: paymentMethod,
      invoice_id: transactionData.invoice_id || null,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
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

  // Special handling for completed transactions - likely means subscription is now active
  if (
    subscriptionRecord?.status === "trialing" &&
    transactionData.status === "completed"
  ) {
    // Transaction completed during trial likely means trial ended and payment succeeded
    await updateUserSubscriptionStatus(userId, "active", supabase);
  } else if (subscriptionRecord?.status) {
    await updateUserSubscriptionStatus(
      userId,
      subscriptionRecord.status,
      supabase
    );
  }
}
