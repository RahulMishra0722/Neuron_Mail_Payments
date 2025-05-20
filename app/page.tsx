import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  // Get the user from the server
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
            {user ? (
              <Link href="/dashboard">
                <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Your Premium Service</h1>
            <p className="text-xl text-gray-400 mb-8">
              Subscribe to get access to all our premium features and content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white px-8 py-6 text-lg h-[60px]">
                  View Pricing
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/sign-up">
                  <Button
                    variant="outline"
                    className="border-[#333] text-white hover:bg-[#333] px-8 py-6 text-lg h-[60px]"
                  >
                    Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
