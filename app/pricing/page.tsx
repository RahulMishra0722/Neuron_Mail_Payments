import { createClient } from "@/lib/supabase/server"
import { hasActiveSubscription } from "@/lib/subscriptions"
import CheckoutButton from "@/components/checkout-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

// Configuration object - easily editable
const PRICING_CONFIG = {
  title: "Choose Your Plan",
  subtitle: "Select the perfect plan for your needs. Upgrade or downgrade at any time.",
  plans: [
    {
      id: "basic",
      name: "Basic",
      price: 9,
      description: "Perfect for individuals getting started",
      features: [
        "Up to 5 projects",
        "Basic analytics",
        "Email support",
        "1GB storage",
        "Standard templates"
      ],
      popular: false,
      buttonText: "Get Started"
    },
    {
      id: "premium",
      name: "Premium",
      price: 29,
      description: "Best for growing businesses and teams",
      features: [
        "Unlimited projects",
        "Advanced analytics & reporting",
        "Priority support",
        "50GB storage",
        "Premium templates",
        "Team collaboration",
        "Custom integrations"
      ],
      popular: true,
      buttonText: "Start Free Trial"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99,
      description: "For large organizations with advanced needs",
      features: [
        "Everything in Premium",
        "Dedicated account manager",
        "Custom onboarding",
        "Unlimited storage",
        "White-label options",
        "Advanced security features",
        "SLA guarantee"
      ],
      popular: false,
      buttonText: "Contact Sales"
    }
  ]
}

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user has an active subscription
  const isSubscribed = user ? await hasActiveSubscription(user.id) : false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              YourApp
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            {PRICING_CONFIG.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {PRICING_CONFIG.subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_CONFIG.plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${plan.popular
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 ml-2 text-lg">
                      /month
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="space-y-4">
                  {isSubscribed ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center font-medium">
                      Current Plan
                    </div>
                  ) : user ? (
                    <CheckoutButton
                      email={user.email}
                      userId={user.id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                    >
                      {plan.buttonText}
                    </CheckoutButton>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/auth/sign-up" className="block">
                        <Button
                          className={`w-full py-3 ${plan.popular
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-gray-900 hover:bg-gray-800'
                            }`}
                        >
                          {plan.buttonText}
                        </Button>
                      </Link>
                      <p className="text-sm text-gray-500 text-center">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info Section */}
        <div className="mt-20 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom solution?
          </p>
          <Link href="/contact">
            <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50">
              Contact Sales
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}