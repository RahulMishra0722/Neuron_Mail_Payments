import { toast } from "@/hooks/use-toast"; // Make sure to import your toast component
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
// Types for Paddle SDK
export type PaddleCheckoutOptions = {
  items: Array<{
    priceId: string;
    quantity: number;
  }>;
  customer: {
    email: string;
    id: string;
  };
  successUrl?: string;
  cancelUrl?: string;
};
let Paddle: Paddle;
// Initialize Paddle SDK
export const initPaddle = async () => {
  try {
    const paddleInstance = await initializePaddle({
      environment:
        (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as
          | "sandbox"
          | "production") || "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        // This is the correct way to handle events in the current Paddle SDK
        console.log("Paddle event received:", event);

        // Check for checkout completion event
        if (event.name === "checkout.completed") {
          console.log("Checkout completed event received:");
          console.log(event);

          // Here you can implement your success handling logic
          // For example, redirect to success page or update UI
          const transactionData = event.data;
          console.log("Payment successful!", transactionData);

          // You might want to call your backend to verify the transaction
          // and update user subscription status

          // If you need to redirect programmatically:
          // window.location.href = `${window.location.origin}/success`;
        }

        // Log other events as needed
        if (event) {
          console.log("Checkout opened");
        }

        if (event.name === "checkout.closed") {
          console.log("Checkout closed");
        }
      },
    });
    if (paddleInstance) Paddle = paddleInstance;
    console.log("Paddle initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Paddle:", error);
    toast({
      title: "Error initializing payment system",
      description: "Please refresh the page and try again.",
      variant: "destructive",
    });
  }
};

export const createCheckout = async (options: PaddleCheckoutOptions) => {
  if (typeof window === "undefined") return null;

  try {
    await initPaddle();

    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
    if (!priceId) {
      throw new Error("Paddle price ID is not configured");
    }

    if (Paddle) {
      const checkout = Paddle.Checkout.open({
        items: [
          {
            priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID || "",
            quantity: 1,
          },
        ],
        customer: {
          email: options.customer.email,
        },
        customData: {
          userId: options.customer.id,
          email: options.customer.email,
        },
        settings: {
          displayMode: "popup",
          theme: "light",
          successUrl: `${window.location.origin}/success`,
          locale: "en",
        },
      });

      return checkout;
    }
  } catch (error) {
    console.error("Paddle checkout error:", error);
    toast({
      title: "Checkout Error",
      description: "There was an error initiating checkout. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};
