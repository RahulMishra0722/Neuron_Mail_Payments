import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { handle_webhook_transaction_updated } from "./webhook-transaction-updated";
import {
  handle_subscription_activated,
  handle_webhook_subscription_canceled,
  handle_webhook_subscription_trialing,
} from "./webhook_subscription_updated";

// Define subscription states based on Paddle's status
type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "expired";

// Function to write webhook data to file
function logWebhookToFile(body: any, headers: any) {
  try {
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), "webhook-logs");

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Create filename with timestamp and event type
    const filename = `webhook-${
      body.event_type || "unknown"
    }-${timestamp.replace(/[:.]/g, "-")}.json`;
    const filepath = path.join(logDir, filename);

    // Prepare readable log entry
    const logEntry = {
      timestamp,
      event_type: body.event_type,
      event_id: body.event_id,
      headers: {
        "paddle-signature": headers["paddle-signature"],
        "content-type": headers["content-type"],
        "user-agent": headers["user-agent"],
      },
      payload: body,
    };

    // Write to individual file
    fs.writeFileSync(filepath, JSON.stringify(logEntry, null, 2));

    // Also append to a master log file for easy viewing
    const masterLogFile = path.join(logDir, "webhook-master.log");
    const logLine = `
================================================================================
${timestamp} - ${body.event_type || "UNKNOWN_EVENT"}
================================================================================
Event ID: ${body.event_id || "N/A"}
Headers: ${JSON.stringify(headers, null, 2)}
Payload: ${JSON.stringify(body, null, 2)}

`;

    fs.appendFileSync(masterLogFile, logLine);

    console.log(`Webhook logged to: ${filepath}`);
    console.log(`Master log updated: ${masterLogFile}`);
  } catch (error) {
    console.error("Error writing webhook log to file:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as a string
    const rawBody = await req.text();
    console.log("Raw webhook body received:", rawBody);

    // Parse the body
    const body = JSON.parse(rawBody);
    const signatureHeader = req.headers.get("paddle-signature");

    // Extract headers for logging
    const headers = {
      "paddle-signature": signatureHeader,
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent"),
    };

    console.log("Webhook event type:", body.event_type);
    console.log("Webhook event data structure:", JSON.stringify(body, null, 2));

    // Log webhook to file FIRST (before any processing)
    logWebhookToFile(body, headers);

    // Verify webhook signature - use the raw body string for verification
    if (!verifyPaddleSignature(rawBody, signatureHeader)) {
      console.error("Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Create a service-level Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from("webhook_events")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Supabase connection test failed:", testError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
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

    console.log("Webhook event logged successfully:", webhookEvent.id);

    try {
      switch (body.event_type) {
        case "subscription.updated":
        case "subscription.canceled":
          await handle_webhook_subscription_canceled(body, supabase);
          break;
        case "subscription.trialing":
          await handle_webhook_subscription_trialing(body, supabase);
          break;
        case "subscription.activated":
          await handle_subscription_activated(body, supabase);
          break;
        case "transaction.updated":
          await handle_webhook_transaction_updated(body, supabase);
          break;
        default:
          console.log(`Unhandled webhook event: ${body.event_type}`);
      }

      await supabase
        .from("webhook_events")
        .update({ processed: true })
        .eq("id", webhookEvent.id);

      console.log("Webhook processed successfully");
      return NextResponse.json({ success: true });
    } catch (processingError) {
      console.error("Error processing webhook:", processingError);
      // Don't mark as processed if there was an error
      throw processingError;
    }
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
  // Skip signature verification in development if needed
  if (process.env.NODE_ENV === "development" && !config.paddle.webhookSecret) {
    console.warn("Skipping signature verification in development");
    return true;
  }

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
    const isValid = digest === signatureParts.h1;
    console.log("Signature verification result:", isValid);
    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
