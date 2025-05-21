"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Types
export type Subscription = {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  status: "active" | "trialing" | "past_due" | "paused" | "canceled";
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

// Get user's subscription
// lib/subscriptions.ts

import { createClient } from "@/lib/supabase/server";

export async function getUserSubscription(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data; // Will be null if no subscription exists
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
}

// Create or update a subscription
export async function upsertSubscription(
  subscription: Partial<Subscription> & { user_id: string }
) {
  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert({
      ...subscription,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting subscription:", error);
    throw error;
  }

  return data as Subscription;
}

// Check if user has an active subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  const isNotCanceled = !subscription.canceled_at;
  const isNotExpired = new Date(subscription.current_period_end) > new Date();

  return isActive && isNotCanceled && isNotExpired;
}
