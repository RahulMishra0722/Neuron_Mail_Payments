// app/api/refund/route.ts
import { NextRequest } from "next/server";

interface RefundRequest {
  transactionId: string;
  reason?: string;
  amount?: number;
}

export async function POST(request: Request) {
  try {
    const { transactionId, reason, amount }: RefundRequest =
      await request.json();

    if (!transactionId) {
      return Response.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    console.log("Processing refund for transaction ID:", transactionId);

    // Determine the API environment
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
    const apiUrl =
      environment === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    // Get the server-side API key
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Paddle API key not configured" },
        { status: 500 }
      );
    }

    // First, get the transaction details to find the transaction item IDs
    console.log("Fetching transaction details...");
    const transactionResponse = await fetch(
      `${apiUrl}/transactions/${transactionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!transactionResponse.ok) {
      const errorData = await transactionResponse.json();
      console.error("Failed to fetch transaction:", errorData);
      return Response.json(
        {
          error: "Failed to fetch transaction details",
          details: errorData.error?.detail,
        },
        { status: transactionResponse.status }
      );
    }

    const transactionData = await transactionResponse.json();
    console.log(
      "Transaction data received:",
      JSON.stringify(transactionData, null, 2)
    );

    // Extract transaction item IDs from the transaction
    const lineItems = transactionData.data?.details?.line_items || [];
    if (lineItems.length === 0) {
      return Response.json(
        { error: "No line items found in transaction" },
        { status: 400 }
      );
    }

    // Prepare refund data using transaction item IDs
    const refundItems = lineItems.map((item: any) => ({
      item_id: item.id,
      type: amount ? "partial" : "full",
      // Convert dollars to cents for Paddle API (multiply by 100)
      ...(amount && { amount: Math.round(amount * 100).toString() }),
    }));

    const refundData = {
      action: "refund", // This was missing!
      transaction_id: transactionId,
      reason: reason || "requested_by_customer",
      items: refundItems,
    };

    console.log("Refund request data:", JSON.stringify(refundData, null, 2));

    // Make the refund request to Paddle
    const response = await fetch(`${apiUrl}/adjustments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundData),
    });

    const data = await response.json();

    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Paddle refund error:", data);
      return Response.json(
        {
          error: "Failed to process refund",
          details: data.error?.detail || "Unknown error",
          paddle_errors: data.error?.errors || [],
        },
        { status: response.status }
      );
    }

    // Return success response
    return Response.json({
      success: true,
      refund: data.data,
      message: "Refund processed successfully",
    });
  } catch (error) {
    console.error("Refund API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
