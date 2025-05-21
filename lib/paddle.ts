import { config } from "./config";
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

// Create a checkout with Paddle
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
          email: options.customer.email ?? "", // Add the user's email
          // Optionally add the user ID if you have a Paddle customer ID already
        },
        customData: {
          userId: options.customer.id, // This is the key part - pass the user ID
        },
        settings: {
          displayMode: "popup", // Always use popup mode to avoid DOM issues
          theme: "light",
          successUrl: `${window.location.origin}/success`,
          locale: "en",
        },
      });
      console.log({ checkout });
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
