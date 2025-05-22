import { NextRequest } from "next/server";

interface PaddleErrorResponse {
  error?: {
    detail?: string;
  };
}

interface PaddleRefundResponse {
  data: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refundId = searchParams.get("refundId");

    if (!refundId) {
      return Response.json({ error: "Refund ID is required" }, { status: 400 });
    }

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

    // Fetch refund details
    const response = await fetch(`${apiUrl}/adjustments/${refundId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data: PaddleErrorResponse & PaddleRefundResponse =
      await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: "Failed to fetch refund details",
          details: data.error?.detail || "Unknown error",
        },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      refund: data.data,
    });
  } catch (error) {
    console.error("Refund fetch error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
