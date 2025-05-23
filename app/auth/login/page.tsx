import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"

export default async function LoginPage() {


  // Check if user is already logged in
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to home page
  if (user) {
    redirect("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  )
}
