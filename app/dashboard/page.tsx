import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscriptions"
import { redirect } from "next/navigation"
import { getTransactionsBySubscription, getAllUserTransactions } from "./transactions"
import DashboardClient from "./dashboard-client"

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
  console.log({ subscription })
  const serializedSubscription = serializeSubscription(subscription)

  // Serialize user data
  const serializedUser = serializeUser(user)

  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing"
  const isTrialing = subscription?.status === "trialing"
  const isCanceled = !!subscription?.canceled_at

  // Get transactions
  const subscriptionTransactions = subscription ? await getTransactionsBySubscription(subscription.id) : []
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

  // Pass all data to the client component
  return (
    <DashboardClient
      user={{
        ...serializedUser,
        formattedCreatedAt: formattedDates.createdAt,
      }}
      subscription={subscription}
      isSubscribed={isSubscribed}
      isTrialing={isTrialing}
      isCanceled={isCanceled}
      daysRemaining={daysRemaining}
      subDetails={subDetails}
      subscriptionTransactions={subscriptionTransactions}
      allTransactions={allTransactions}
      formattedDates={formattedDates}
    />
  )
}
