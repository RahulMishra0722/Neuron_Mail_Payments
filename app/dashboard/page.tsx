import { createClient } from "@/lib/supabase/server"
import { getUserSubscription } from "@/lib/subscriptions"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/actions"
import CheckoutButton from "@/components/checkout-button"

export default async function DashboardPage() {
  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // Get user's subscription
  const subscription = await getUserSubscription(user.id)
  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing"

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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

            {isSubscribed ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
                  Active Subscription
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Status:</span> {subscription?.status}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Plan:</span> Premium
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Current Period Ends:</span>{" "}
                    {formatDate(subscription?.current_period_end)}
                  </p>
                  {subscription?.canceled_at && (
                    <p className="text-red-400">
                      <span className="text-gray-500">Canceled:</span> {formatDate(subscription?.canceled_at)}
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">Cancel Subscription</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-700 px-4 py-3 rounded">
                  No active subscription
                </div>

                <p className="text-gray-400 mt-4">Subscribe to get access to all premium features.</p>

                <div className="mt-6">
                  <CheckoutButton
                    email={user.email}
                    userId={user.id}
                    className="bg-[#2b725e] hover:bg-[#235e4c] text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
