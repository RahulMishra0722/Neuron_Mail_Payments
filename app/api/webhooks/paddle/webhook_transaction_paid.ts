import { SupabaseClient } from "@supabase/supabase-js";

export const handle_webhook_transaction_paid = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
  } catch (error) {
    console.error("Error handling subscription cancellation webhook:", error);
    throw error;
  }
};
