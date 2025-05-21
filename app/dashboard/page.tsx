import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscriptions"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/actions"
import CheckoutButton from "@/components/checkout-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get subscription if it exists
  const subscription = await getUserSubscription(user.id)

  // Check if user is subscribed
  const isSubscribed = subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    subscription?.status === "past_due"; // Include past_due as still technically subscribed

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Helper function to get status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 border border-green-500/50 text-green-500";
      case "trialing":
        return "bg-blue-500/10 border border-blue-500/50 text-blue-500";
      case "past_due":
        return "bg-yellow-500/10 border border-yellow-500/50 text-yellow-500";
      case "paused":
        return "bg-purple-500/10 border border-purple-500/50 text-purple-500";
      case "canceled":
        return "bg-gray-500/10 border border-gray-500/50 text-gray-400";
      case "expired":
        return "bg-red-500/10 border border-red-500/50 text-red-500";
      default:
        return "bg-yellow-500/10 border border-yellow-500/50 text-yellow-500";
    }
  };

  // Get friendly status name
  const getStatusName = (status?: string) => {
    switch (status) {
      case "active": return "Active";
      case "trialing": return "Trial";
      case "past_due": return "Payment Past Due";
      case "paused": return "Paused";
      case "canceled": return "Canceled";
      case "expired": return "Expired";
      default: return "No Subscription";
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#161616]">
      <header className="border-b border-[#333] py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link href="/" className="text-white text-xl font-bold">
            Your App
          </Link>
          <div className="space-x-4">
            <Link href="/pricing">
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">
                Pricing
              </Button>
            </Link>
            <form action={signOut} className="inline">
              <Button type="submit" variant="ghost" className="text-white hover:bg-[#333]">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>

          <div className="bg-[#222] border border-[#333] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Account Information</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="text-gray-500">Email:</span> {user.email}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">User ID:</span> {user.id}
              </p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Subscription Status</h2>

            {subscription ? (
              <div className="space-y-4">
                <div className={`px-4 py-3 rounded flex items-center ${getStatusBadge(subscription.status)}`}>
                  <span className="font-medium">{getStatusName(subscription.status)}</span>
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Plan ID:</span> {subscription.plan_id || "N/A"}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Current Period Started:</span>{" "}
                    {formatDate(subscription.current_period_start)}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Current Period Ends:</span>{" "}
                    {formatDate(subscription.current_period_end)}
                  </p>
                  {subscription.canceled_at && (
                    <p className="text-red-400">
                      <span className="text-gray-500">Canceled:</span> {formatDate(subscription.canceled_at)}
                      <span className="ml-2 text-xs text-gray-500">(Access until period end)</span>
                    </p>
                  )}
                </div>

                <div className="mt-6 flex space-x-4">
                  {subscription.status === "active" && (
                    <Link href="/account/manage-subscription">
                      <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white">
                        Manage Subscription
                      </Button>
                    </Link>
                  )}

                  {(subscription.status === "active" || subscription.status === "trialing") &&
                    !subscription.canceled_at && (
                      <Link href="/account/cancel-subscription">
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
                          Cancel Subscription
                        </Button>
                      </Link>
                    )}

                  {(subscription.status === "canceled" || subscription.status === "expired") && (
                    <CheckoutButton
                      email={user.email ?? ""}
                      userId={user.id}
                      className="bg-[#2b725e] hover:bg-[#235e4c] text-white"
                    >
                      Resubscribe
                    </CheckoutButton>
                  )}

                  {subscription.status === "past_due" && (
                    <Link href="/account/update-payment">
                      <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                        Update Payment Method
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-3 rounded">
                  No active subscription
                </div>

                <p className="text-gray-400 mt-4">Subscribe to get access to all premium features.</p>

                <div className="mt-6">
                  {
                    user.email && user.id ?
                      <CheckoutButton
                        email={user.email}
                        userId={user.id}
                        className="bg-[#2b725e] hover:bg-[#235e4c] text-white"
                      >
                        Subscribe Now
                      </CheckoutButton>
                      : `You must login or signup first to proceed to the payments`
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}