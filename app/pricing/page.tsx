import { createClient } from "@/lib/supabase/server"
import { hasActiveSubscription } from "@/lib/subscriptions"
import { PricingPlans } from "@/components/pricing-plans"
import { Separator } from "@/components/ui/separator"
import { CheckCircle } from "lucide-react"

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user has an active subscription
  const isSubscribed = user ? await hasActiveSubscription(user.id) : false

  // Common features across all plans
  const commonFeatures = [
    "Secure payment processing",
    "Customer portal access",
    "Email notifications",
    "Basic reporting",
    "SSL encryption",
    "99.9% uptime guarantee",
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Pricing Plans */}
      <div className="bg-background">
        <PricingPlans userId={user?.id} userEmail={user?.email} isSubscribed={isSubscribed} />
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Find answers to common questions about our subscription plans.</p>
          </div>

          <div className="mx-auto max-w-3xl mt-12 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">How does the 7-day trial work?</h3>
              <p className="text-muted-foreground">
                You can try any plan free for 14 days. We'll only charge you when the trial ends, and you can cancel
                anytime before then.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, with prorated
                billing.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">How do I cancel my subscription?</h3>
              <p className="text-muted-foreground">
                You can cancel your subscription anytime from your account dashboard. Your access will continue until
                the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All Plans Include */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">All Plans Include</h2>
            <p className="text-muted-foreground">Every subscription comes with these essential features.</p>
          </div>

          <div className="mx-auto max-w-4xl mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
