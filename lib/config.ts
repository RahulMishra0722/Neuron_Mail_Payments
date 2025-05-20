// Environment configuration
export const config = {
  // Paddle configuration
  paddle: {
    vendorId: process.env.PADDLE_VENDOR_ID || "",
    apiKey: process.env.PADDLE_API_KEY || "",
    publicKey: process.env.PADDLE_PUBLIC_KEY || "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || "",
    isSandbox: process.env.PADDLE_ENVIRONMENT === "sandbox",
    planId: "pro_01jvm7jva8xejzhnsmmwgy9dcv",
    clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
    price: "3.99",
    currency: "USD",
  },
  // App configuration
  app: {
    name: "Your App Name",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
};
