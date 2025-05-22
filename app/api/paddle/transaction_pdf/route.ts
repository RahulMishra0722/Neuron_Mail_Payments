import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required in request body" },
        { status: 400 }
      );
    }

    const paddleApiKey = process.env.PADDLE_API_KEY;
    const paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;

    if (!paddleApiKey) {
      return NextResponse.json(
        { error: "Paddle API key not configured" },
        { status: 500 }
      );
    }

    // Determine API URL based on environment
    const baseUrl =
      paddleEnvironment === "sandbox"
        ? "https://sandbox-api.paddle.com"
        : "https://api.paddle.com";

    // Fetch the transaction PDF
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}/invoice`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          Accept: "application/pdf",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        {
          error: "Failed to fetch transaction PDF from Paddle",
          details: errorData,
          status: response.status,
        },
        { status: response.status }
      );
    }

    // Get the PDF as buffer
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="transaction-${transactionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
