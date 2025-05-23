import { toast } from "@/hooks/use-toast";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

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

let Paddle: Paddle | null = null;
let isInitializing = false;

// Initialize Paddle SDK - only once
export const initPaddle = async (): Promise<Paddle | null> => {
  // Return existing instance if already initialized
  if (Paddle) return Paddle;

  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    // Wait for the current initialization to complete
    return new Promise((resolve) => {
      const checkInitialization = () => {
        if (Paddle) {
          resolve(Paddle);
        } else if (!isInitializing) {
          resolve(null);
        } else {
          setTimeout(checkInitialization, 100);
        }
      };
      checkInitialization();
    });
  }

  isInitializing = true;

  try {
    const paddleInstance = await initializePaddle({
      environment:
        (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as
          | "sandbox"
          | "production") || "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      eventCallback: (event) => {
        console.log("Paddle event received:", event);

        if (event.name === "checkout.completed") {
          console.log("Checkout completed event received:", event);
          const transactionData = event.data;
          console.log("Payment successful!", transactionData);

          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
          });
        }
        //@ts-ignore
        if (event.name === "checkout.opened") {
          console.log("Checkout opened");
        }

        if (event.name === "checkout.closed") {
          console.log("Checkout closed");
        }
      },
    });

    if (paddleInstance) {
      Paddle = paddleInstance;
      console.log("Paddle initialized successfully");
      return Paddle;
    }

    throw new Error("Failed to initialize Paddle instance");
  } catch (error) {
    console.error("Failed to initialize Paddle:", error);
    toast({
      title: "Error initializing payment system",
      description: "Please refresh the page and try again.",
      variant: "destructive",
    });
    return null;
  } finally {
    isInitializing = false;
  }
};

export const createCheckout = async (options: PaddleCheckoutOptions) => {
  if (typeof window === "undefined") return null;

  try {
    // Ensure Paddle is initialized
    const paddleInstance = await initPaddle();

    if (!paddleInstance) {
      throw new Error("Failed to initialize Paddle");
    }

    const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID;
    if (!priceId) {
      throw new Error("Paddle price ID is not configured");
    }

    const checkout = paddleInstance.Checkout.open({
      items: [
        {
          priceId: priceId,
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
        successUrl: options.successUrl,
        locale: "en",
      },
    });

    return checkout;
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
