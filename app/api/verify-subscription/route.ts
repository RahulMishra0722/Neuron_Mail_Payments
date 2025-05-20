import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { hasActiveSubscription } from "@/lib/subscriptions"

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract token
    const token = authHeader.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Verify token with Supabase
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check subscription status
    const isSubscribed = await hasActiveSubscription(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      subscription: {
        active: isSubscribed,
      },
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
