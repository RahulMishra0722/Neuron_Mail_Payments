import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscriptions"
import { redirect } from "next/navigation"
import { LogOut, CreditCard, User, Home, ChevronRight, Shield, CheckCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { signout } from "@/lib/actions"

// Type definitions
interface Subscription {
  id: string
  user_id: string
  status?: string
  plan_id?: string
  current_period_start?: string
  current_period_end?: string
  canceled_at?: string
  created_at?: string
  updated_at?: string
  price_amount?: number
  price_name?: string
  product_name?: string
  trial_start?: string
  trial_end?: string
  billing_interval?: string
}

// Helper function to serialize data for client components
function serializeSubscription(subscription: any): Subscription | null {
  if (!subscription) return null

  return {
    id: subscription.id || '',
    user_id: subscription.user_id || '',
    status: subscription.status || undefined,
    plan_id: subscription.plan_id || undefined,
    current_period_start: subscription.current_period_start || undefined,
    current_period_end: subscription.current_period_end || undefined,
    canceled_at: subscription.canceled_at || undefined,
    created_at: subscription.created_at || undefined,
    updated_at: subscription.updated_at || undefined,
    price_amount: subscription.price_amount || undefined,
    price_name: subscription.price_name || undefined,
    product_name: subscription.product_name || undefined,
    trial_start: subscription.trial_start || undefined,
    trial_end: subscription.trial_end || undefined,
    billing_interval: subscription.billing_interval || undefined,
  }
}

// Helper function to serialize user data
function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    // Add other user fields you need, but only primitive types
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get raw subscription data and serialize it
  const rawSubscription = await getUserSubscription(user.id)
  const subscription = serializeSubscription(rawSubscription)

  // Serialize user data
  const serializedUser = serializeUser(user)

  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing"
  const isTrialing = subscription?.status === "trialing"
  const isCanceled = !!subscription?.canceled_at

  // Format dates
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate days remaining in trial or subscription
  const getDaysRemaining = (endDate?: string): number => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining(subscription?.current_period_end)
  const trialDaysRemaining = getDaysRemaining(subscription?.trial_end)

  // Get subscription details
  const getSubscriptionDetails = () => {
    if (!subscription) return null

    return {
      planName: subscription.price_name || subscription.product_name || "Premium",
      amount: subscription.price_amount ? `$${(subscription.price_amount / 100).toFixed(2)}` : "N/A",
      interval: subscription.billing_interval
        ? subscription.billing_interval.charAt(0).toUpperCase() + subscription.billing_interval.slice(1)
        : "Monthly",
      trialEnd: subscription.trial_end ? formatDate(subscription.trial_end) : null,
    }
  }

  const subDetails = getSubscriptionDetails()

  // Sample invoices for the user (ensure this is a plain object)
  const invoices = [
    {
      id: "INV-001",
      date: "May 1, 2023",
      amount: "$29.00",
      status: "Paid",
    },
    {
      id: "INV-002",
      date: "June 1, 2023",
      amount: "$29.00",
      status: "Paid",
    },
    {
      id: "INV-003",
      date: "July 1, 2023",
      amount: "$29.00",
      status: "Paid",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 flex items-center">
            <Home className="h-5 w-5 mr-2" />
            <span>YourStartup</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <form action={signout} className="inline">
              <Button type="submit" variant="ghost" size="sm" className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-700">My Subscription</span>
          </div>

          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">My Subscription</h1>
              <p className="text-gray-500">Manage your subscription and billing information</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Link href="/account">
                <Button variant="outline" size="sm" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subscription Status Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Subscription Status</CardTitle>
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                {isSubscribed ? (
                  <div>
                    <div className="flex items-center mb-6">
                      <Badge variant={isCanceled ? "outline" : isTrialing ? "secondary" : "default"} className="mr-2">
                        {isCanceled ? "Canceled" : isTrialing ? "Trial" : "Active"}
                      </Badge>
                      {isTrialing && trialDaysRemaining > 0 && (
                        <span className="text-sm text-gray-500">Trial ends in {trialDaysRemaining} days</span>
                      )}
                      {isCanceled && (
                        <span className="text-sm text-gray-500">
                          Access until {formatDate(subscription?.current_period_end)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Plan</p>
                          <p className="text-gray-900 text-lg font-medium">{subDetails?.planName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Billing</p>
                          <p className="text-gray-900">
                            {subDetails?.amount} / {subDetails?.interval}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium text-gray-500">Current Period</p>
                            <p className="text-sm text-gray-500">{daysRemaining} days left</p>
                          </div>
                          <Progress value={(daysRemaining / 30) * 100} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            Next billing date: {formatDate(subscription?.current_period_end)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Payment Method</p>
                          <p className="text-gray-900">•••• •••• •••• 4242</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {!isCanceled ? (
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Cancel Subscription
                        </Button>
                      ) : (
                        <Button>Reactivate Subscription</Button>
                      )}
                      <Link href="/billing/update-payment">
                        <Button variant="outline">Update Payment Method</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">No active subscription</h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <p>Subscribe to our premium plan to access all features and benefits.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link href="/pricing">
                        <Button className="w-full md:w-auto">View Pricing Plans</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Account Info</CardTitle>
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{serializedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-gray-900">{formatDate(serializedUser.created_at || subscription?.created_at)}</p>
                </div>
                <Link href="/account/profile">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Billing History */}
            {isSubscribed && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your recent invoices and payment history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 border-b bg-gray-50 p-4 text-sm font-medium text-gray-500">
                      <div>Invoice</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="grid grid-cols-5 p-4 text-sm">
                        <div className="font-medium">{invoice.id}</div>
                        <div>{invoice.date}</div>
                        <div>{invoice.amount}</div>
                        <div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Features */}
            {isSubscribed && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Your Plan Features</CardTitle>
                  <CardDescription>Features included in your current subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 1: Advanced analytics and reporting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 2: Unlimited projects and collaborators</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 3: Priority customer support</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 4: Custom integrations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 5: Advanced security features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Feature 6: API access</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} YourStartup, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}