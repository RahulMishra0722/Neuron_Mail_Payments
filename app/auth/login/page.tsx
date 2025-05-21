import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"
import { cookies } from "next/headers"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // If Supabase is not configured, show setup message directly
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#161616]">
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Supabase to get started</h1>
      </div>
    )
  }

  const cookieStore = cookies()

  // Check if user is already logged in - using getUser() as recommended by Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to home page
  if (user) {
    console.log("User already logged in, redirecting to home:", user.email)
    redirect("/")
  }

  // Extract error message from query params if present
  const error = searchParams.error as string | undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#161616] px-4 py-12 sm:px-6 lg:px-8">
      {error && (
        <div className="absolute top-4 w-full max-w-md bg-red-500 text-white p-3 rounded text-center">
          {error === "auth_exchange_failed"
            ? "Authentication failed. Please try again."
            : "Something went wrong. Please try again."}
        </div>
      )}
      <LoginForm />
    </div>
  )
}