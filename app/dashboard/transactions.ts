import { createClient } from "@/lib/supabase/server";

// Type definitions
export interface Transaction {
  id: string;
  user_id: string;
  subscription_id: string;
  paddle_transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_id?: string;
  invoice_number?: string;
  billed_at: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  collection_mode: string;
  origin: string;
  subtotal: number;
  tax_total: number;
  fee_total: number;
  discount_total: number;
  grand_total: number;
  payment_status: string;
  payment_method_type?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  raw_transaction_data: any;
}

// Function to get transactions by subscription ID
export async function getTransactionsBySubscription(
  subscriptionId: string
): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return transactions || [];
}

// Function to get all transactions for a user
export async function getAllUserTransactions(
  userId: string
): Promise<Transaction[]> {
  const supabase = await createClient();

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }

  return transactions || [];
}
