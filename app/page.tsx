import Link from "next/link"
import { ArrowRight, CheckCircle, BarChart3, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { siteConfig } from "@/config/site-config"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Key benefits - easily customizable
  const benefits = [
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "Connect with your existing systems in minutes, not days.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with advanced encryption and compliance.",
    },
    {
      icon: BarChart3,
      title: "Powerful Analytics",
      description: "Gain insights into your subscription metrics and customer behavior.",
    },
  ]

  // Features section
  const features = [
    {
      title: "Flexible Subscription Management",
      description:
        "Create and manage subscription plans with ease. Support for trials, discounts, and custom billing cycles.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      title: "Global Payment Processing",
      description: "Accept payments in multiple currencies with support for all major payment methods worldwide.",
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      title: "Comprehensive Reporting",
      description: "Track revenue, churn, and customer lifetime value with beautiful, intuitive dashboards.",
      image: "/placeholder.svg?height=400&width=600",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Subscription Management Made Simple
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Everything you need to launch, manage, and scale your subscription business. Start your 7-day free
                trial today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg" className="px-8">
                  View Pricing
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/signup">
                  <Button variant="outline" size="lg" className="px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Why Choose {siteConfig.name}</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Our platform provides everything you need to manage subscriptions efficiently.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-12 lg:gap-16 mt-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Powerful Features</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Everything you need to manage subscriptions and payments in one place.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                  } gap-8 items-center`}
              >
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-primary mr-2" />
                      <span>Easy to implement</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-primary mr-2" />
                      <span>Fully customizable</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-primary mr-2" />
                      <span>Enterprise-ready</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1">
                  <img
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    className="rounded-lg border shadow-lg"
                    width={600}
                    height={400}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to get started?</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Join thousands of businesses that trust our platform for their subscription needs.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/pricing">
                <Button size="lg" className="px-8">
                  View Pricing
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
