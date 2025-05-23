export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return Response.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const paddleApiKey = process.env.PADDLE_API_KEY;
    const paddleEnvironment = process.env.PADDLE_ENVIRONMENT || "sandbox"; // 'sandbox' or 'production'

    if (!paddleApiKey) {
      return Response.json(
        { error: "Paddle API key not configured" },
        { status: 500 }
      );
    }

    // Determine the correct Paddle API URL based on environment
    const baseUrl =
      paddleEnvironment === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    const response = await fetch(
      `${baseUrl}/transactions?subscription_id=${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return Response.json(
        {
          error: "Failed to fetch transactions from Paddle",
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract transaction IDs for easier access
    const transactionIds =
      data.data?.map((transaction: any) => transaction.id) || [];

    return Response.json({
      success: true,
      transactions: data.data,
      transactionIds,
      meta: data.meta,
    });
  } catch (error) {
    console.error("Error fetching Paddle transactions:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
