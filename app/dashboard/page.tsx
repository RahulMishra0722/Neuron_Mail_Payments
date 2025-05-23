import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscriptions"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TransactionTable } from "@/components/dashboard/transactions-table"
import { CheckCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllUserTransactions, getTransactionsBySubscription } from "./transactions"
import { SubscriptionCard } from "@/components/dashboard/subscription-card"

// Helper function to serialize data for client components
function serializeSubscription(subscription: any) {
  if (!subscription) return null

  return {
    id: subscription.id || "",
    user_id: subscription.user_id || "",
    paddle_subscription_id: subscription.paddle_subscription_id || undefined,
    paddle_customer_id: subscription.paddle_customer_id || undefined,
    status: subscription.status || undefined,
    plan_id: subscription.plan_id || undefined,
    current_period_start: subscription.current_period_start || undefined,
    current_period_end: subscription.current_period_end || undefined,
    canceled_at: subscription.canceled_at || undefined,
    created_at: subscription.created_at || undefined,
    updated_at: subscription.updated_at || undefined,
    price: subscription.price || undefined,
    currency_code: subscription.currency_code || undefined,
  }
}

// Helper function to serialize user data
function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  }
}

// Helper function to format dates
function formatDateString(dateString?: string): string {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
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
  const subscription = await getUserSubscription(user.id)
  const serializedSubscription = serializeSubscription(subscription)

  // Serialize user data
  const serializedUser = serializeUser(user)

  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing"
  const isTrialing = subscription?.status === "trialing"
  const isCanceled = !!subscription?.canceled_at

  // Get transactions
  const subscriptionTransactions = subscription ? await getTransactionsBySubscription(subscription.paddle_subscription_id) : []
  const allTransactions = await getAllUserTransactions(user.id)

  // Calculate days remaining in trial or subscription
  const getDaysRemaining = (endDate?: string): number => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = getDaysRemaining(subscription?.current_period_end)

  // Get subscription details
  const getSubscriptionDetails = () => {
    if (!subscription) return null

    return {
      planName: "Premium", // You might want to map plan_id to actual plan names
      amount: subscription.price ? `$${subscription.price.toFixed(2)}` : "N/A",
      interval: "Monthly", // You might want to determine this from your plan data
      currency: subscription.currency_code || "USD",
    }
  }

  const subDetails = getSubscriptionDetails()

  // Pre-format all dates
  const formattedDates = {
    currentPeriodStart: formatDateString(subscription?.current_period_start),
    currentPeriodEnd: formatDateString(subscription?.current_period_end),
    canceledAt: formatDateString(subscription?.canceled_at),
    createdAt: formatDateString(user.created_at),
  }

  // Safely get the transaction_id with proper error handling
  const getTransactionId = () => {
    if (!subscription?.paddle_subscription_id || !allTransactions.length) {
      return null
    }

    const matchingTransaction = allTransactions.find(
      (transaction: any) => transaction.subscription_id === subscription.paddle_subscription_id,
    )

    return matchingTransaction?.paddle_transaction_id || null
  }
  const transaction_id = allTransactions.find(txn => txn.subscription_id === subscription.paddle_subscription_id)

  return (
    <div className="container px-4 md:px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Subscription Status Card */}
          <div className="md:col-span-2">
            <SubscriptionCard
              subscription={serializedSubscription}
              isSubscribed={isSubscribed}
              isTrialing={isTrialing}
              isCanceled={isCanceled}
              daysRemaining={daysRemaining}
              subDetails={subDetails}
              formattedDates={formattedDates}
              transactionId={transaction_id?.paddle_transaction_id || undefined}
            />
          </div>

          {/* Account Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Account Info</CardTitle>
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p>{formattedDates.createdAt}</p>
              </div>
              {subscription && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
                  <p className="text-xs font-mono">{subscription.paddle_subscription_id}</p>
                </div>
              )}
              <Link href="/account/profile">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Transactions</CardTitle>
            <CardDescription>View your payment history and download transaction PDFs</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">
                  {isCanceled ? "Previous Subscription" : "Current Subscription"}
                </TabsTrigger>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Transactions for your {isCanceled ? "previous" : "current"} subscription
                  </p>
                  <Badge variant="secondary">{subscriptionTransactions.length} transactions</Badge>
                </div>
                <TransactionTable transactions={subscriptionTransactions} />
              </TabsContent>
              <TabsContent value="all" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">All transactions across all subscriptions</p>
                  <Badge variant="secondary">{allTransactions.length} transactions</Badge>
                </div>
                <TransactionTable transactions={allTransactions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Subscription Features - Only show for active subscriptions */}
        {isSubscribed && !isCanceled && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Plan Features</CardTitle>
              <CardDescription>Features included in your current subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Advanced analytics and reporting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Unlimited projects and collaborators</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Advanced security features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
