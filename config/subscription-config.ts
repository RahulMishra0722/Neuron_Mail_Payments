// To use single plan mode, set NEXT_PUBLIC_SUBSCRIPTION_MODE=single in your .env file.
// The default single plan is 'professional'. Change with NEXT_PUBLIC_SINGLE_PLAN_ID=<plan_id>.

// Subscription plans configuration
export type PlanFeature = {
  title: string;
  description?: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
  paddlePlanId?: string;
  trialDays?: number;
  highlight?: boolean;
  badge?: string;
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential tools for small businesses and startups",
    price: 29,
    currency: "USD",
    interval: "monthly",
    features: [
      { title: "Up to 5 projects", included: true },
      { title: "Basic analytics", included: true },
      { title: "Email support", included: true },
      { title: "5GB storage", included: true },
      { title: "Standard templates", included: true },
      { title: "API access", included: false },
      { title: "Advanced integrations", included: false },
      { title: "Priority support", included: false },
    ],
    buttonText: "Get Started",
    paddlePlanId: "pri_01",
    trialDays: 14,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Advanced features for growing businesses",
    price: 3.99,
    currency: "USD",
    interval: "monthly",
    features: [
      {
        title:
          "Custom AI workers to automate email handling, such as setting reminders, managing calendar events, and performing actions based on sender or content and you get to control what these workers do!",
        included: true,
      },
      {
        title:
          "Full control over inbox behavior with rule-based and AI-powered email routing",
        included: true,
      },
      {
        title:
          "Intelligent, AI-driven folder creation and advanced filtering to keep your inbox organized and clutter-free",
        included: true,
      },
      {
        title:
          "You are in control of Everything that AI does and how it does it",
        included: true,
      },
      {
        title:
          "Your data never leaves your device—privacy by design and is never stored anywhere on the cloud!",
        included: true,
      },
    ],
    buttonText: "Start Free Trial",
    paddlePlanId: "pri_01jwxd3k1vq3166bvgmyxnpnhc",
    trialDays: 14,
    popular: true,
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: 199,
    currency: "USD",
    interval: "monthly",
    features: [
      { title: "Unlimited projects", included: true },
      { title: "Advanced analytics", included: true },
      { title: "Dedicated support", included: true },
      { title: "Unlimited storage", included: true },
      { title: "Premium templates", included: true },
      { title: "API access", included: true },
      { title: "Advanced integrations", included: true },
      { title: "Custom branding", included: true },
    ],
    buttonText: "Contact Sales",
    paddlePlanId: "pri_03",
  },
];
