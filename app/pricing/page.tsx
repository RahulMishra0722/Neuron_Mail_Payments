import { createClient } from "@/lib/supabase/server"
import { hasActiveSubscription } from "@/lib/subscriptions"
import CheckoutButton from "@/components/checkout-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user has an active subscription
  const isSubscribed = user ? await hasActiveSubscription(user.id) : false

  return (
    <div className="flex min-h-screen flex-col bg-[#161616]">
      <header className="border-b border-[#333] py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link href="/" className="text-white text-xl font-bold">
            Your App
          </Link>
          <div className="space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" className="border-[#333] text-white hover:bg-[#333]">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-400">Get access to all features for one low price.</p>
        </div>

        <div className="max-w-md mx-auto bg-[#222] border border-[#333] rounded-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Premium Plan</h2>
            <div className="flex items-baseline mb-4">
              <span className="text-4xl font-bold text-white">${"3.99"}</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Feature 1
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Feature 2
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Feature 3
              </li>
            </ul>

            {isSubscribed ? (
              <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded text-center">
                You are already subscribed!
              </div>
            ) : user ? (
              <CheckoutButton email={user.email} userId={user.id} />
            ) : (
              <div className="space-y-4">
                <Link href="/auth/sign-up" className="block">
                  <Button className="w-full bg-[#2b725e] hover:bg-[#235e4c] text-white">Sign Up to Subscribe</Button>
                </Link>
                <p className="text-sm text-gray-500 text-center">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#2b725e] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
