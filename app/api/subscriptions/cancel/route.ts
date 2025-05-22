// app/api/subscriptions/cancel/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Get the current user from the supabase client
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("API Route Error: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { subscriptionId, effectiveFrom } = await req.json();

    if (!subscriptionId) {
      console.log("API Route Error: No subscription ID provided");
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log(`Processing cancellation for subscription: ${subscriptionId}`);
    console.log(`Cancellation effective from: ${effectiveFrom}`);

    // Determine the API environment
    const environment = process.env.PADDLE_ENVIRONMENT || "sandbox";
    const apiUrl =
      environment === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    // Get the server-side API key (stored securely in environment variables)
    const apiKey = process.env.PADDLE_API_KEY;

    if (!apiKey) {
      console.log("API Route Error: Paddle API key not configured");
      return NextResponse.json(
        { error: "Paddle API key is not configured" },
        { status: 500 }
      );
    }

    // console.log(`Using Paddle environment: ${environment}`);
    // console.log(
    //   `API key available: ${
    //     apiKey ? "Yes (starts with: " + apiKey.substring(0, 4) + "...)" : "No"
    //   }`
    // );

    // Prepare the request body - using the right format for the API version
    const requestBody = {
      effective_from:
        effectiveFrom === "immediate" ? "immediately" : "billing_period_end",
    };

    // API v2 uses a different endpoint structure than v1
    const apiEndpoint = `${apiUrl}/subscriptions/${subscriptionId}/cancel`;

    console.log(`Request URL: ${apiEndpoint}`);
    console.log(`Request method: POST`);
    console.log(`Request body: ${JSON.stringify(requestBody)}`);
    console.log(
      `Request headers: Content-Type: application/json, Authorization: Bearer [hidden]`
    );

    // Make the cancellation request to Paddle using API v2
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Log the raw response status
    console.log(`Paddle API response status: ${response.status}`);

    // Try to get the response body, even if it's an error
    let data;
    try {
      data = await response.json();
      console.log("Paddle API response:", JSON.stringify(data));
    } catch (e) {
      console.error("Failed to parse Paddle response:", e);
      const textResponse = await response.text();
      console.log("Raw response text:", textResponse);
      data = { error: "Invalid response from Paddle" };
    }

    if (!response.ok) {
      console.log(`API Route Error: Paddle returned error ${response.status}`);
      return NextResponse.json(
        {
          error: data.error?.message || "Failed to cancel subscription",
          paddleError: data,
        },
        { status: response.status }
      );
    }

    // Optional: Update your database to reflect the cancellation status
    console.log("Cancellation successful, updating local database...");

    try {
      // Record the cancellation in your database
      const { error } = await supabase
        .from("subscriptions")
        .update({
          canceled_at: new Date().toISOString(),
          status: effectiveFrom === "immediate" ? "canceled" : "active",
        })
        .eq("user_id", user.id)
        .eq("paddle_subscription_id", subscriptionId);

      if (error) {
        console.log("Database update error:", error);
      }
    } catch (dbError) {
      console.error("Error updating subscription status in database:", dbError);
      // Continue anyway as the Paddle operation was successful
    }

    return NextResponse.json({
      success: true,
      message: `Subscription cancelled ${
        effectiveFrom === "immediate"
          ? "immediately"
          : "at the end of the billing period"
      }`,
      data,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      {
        error: "Failed to process cancellation request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
