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
    price: 79,
    currency: "USD",
    interval: "monthly",
    features: [
      { title: "Unlimited projects", included: true },
      { title: "Advanced analytics", included: true },
      { title: "Priority support", included: true },
      { title: "50GB storage", included: true },
      { title: "Premium templates", included: true },
      { title: "API access", included: true },
      { title: "Advanced integrations", included: true },
      { title: "Custom branding", included: false },
    ],
    buttonText: "Start Free Trial",
    paddlePlanId: "pri_02",
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
