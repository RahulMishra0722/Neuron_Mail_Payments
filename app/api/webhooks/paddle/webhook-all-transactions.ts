import { SupabaseClient } from "@supabase/supabase-js";

interface CreateTransaction {
  user_id: string;
  subscription_id: string | null;
  paddle_transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_id?: string | null;
  invoice_number?: string | null;
  billed_at: any;
  created_at: any;
  updated_at: any;
  customer_id: any;
  collection_mode: any;
  origin: any;
  subtotal: any;
  tax_total: any;
  fee_total: any;
  discount_total: any;
  grand_total: any;
  payment_status: any;
  payment_method_type: any;
  billing_period_start: any;
  billing_period_end: any;
  raw_transaction_data: any;
}

// Helper function to extract transaction data from webhook
function extractTransactionData(data: any): CreateTransaction {
  const payment = data.payments?.[0]; // Get first payment (most recent)
  const totals = data.details?.totals;

  return {
    user_id: data.custom_data?.userId,
    subscription_id: data.subscription_id,
    paddle_transaction_id: data.id,
    amount: parseFloat(totals?.total || "0") / 100, // Convert cents to dollars
    currency: data.currency_code,
    status: data.status,
    invoice_id: data.invoice_id,
    invoice_number: data.invoice_number,
    billed_at: data.billed_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
    customer_id: data.customer_id,
    collection_mode: data.collection_mode,
    origin: data.origin,
    subtotal: parseFloat(totals?.subtotal || "0") / 100,
    tax_total: parseFloat(totals?.tax || "0") / 100,
    fee_total: parseFloat(totals?.fee || "0") / 100,
    discount_total: parseFloat(totals?.discount || "0") / 100,
    grand_total: parseFloat(totals?.grand_total || "0") / 100,
    payment_status: payment?.status,
    payment_method_type: payment?.method_details?.type,
    billing_period_start: data.billing_period?.starts_at,
    billing_period_end: data.billing_period?.ends_at,
    raw_transaction_data: data,
  };
}

// Helper function to upsert transaction (handles race conditions)
async function upsertTransaction(
  transactionData: CreateTransaction,
  supabase: SupabaseClient
) {
  const { data, error } = await supabase
    .from("transactions")
    .upsert(transactionData, {
      onConflict: "paddle_transaction_id",
      ignoreDuplicates: false, // Always update
    })
    .select();

  if (error) {
    throw new Error(`Database upsert failed: ${error.message}`);
  }

  return data;
}

// Helper function to look up user_id by subscription_id or customer_id
async function getUserIdFromSubscriptionOrCustomer(
  supabase: SupabaseClient,
  subscriptionId: string | null,
  customerId: string | null
): Promise<string | null> {
  if (subscriptionId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", subscriptionId)
      .single();
    if (data?.user_id) return data.user_id;
  }
  if (customerId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_customer_id", customerId)
      .single();
    if (data?.user_id) return data.user_id;
  }
  return null;
}

// Patch all transaction handlers to use the helper
export const handle_webhook_transaction_billed = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to billed
    transactionData.status = "billed";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction billed successfully:", result[0]);
    return {
      success: true,
      message: "Transaction billed successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction billed webhook:", error);
    throw error;
  }
};

export const handle_webhook_transaction_canceled = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to canceled
    transactionData.status = "canceled";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction canceled successfully:", result[0]);
    return {
      success: true,
      message: "Transaction canceled successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction canceled webhook:", error);
    throw error;
  }
};

export const handle_webhook_transaction_paid = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to paid
    transactionData.status = "paid";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction paid successfully:", result[0]);
    return {
      success: true,
      message: "Transaction paid successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction paid webhook:", error);
    throw error;
  }
};

export const handle_webhook_transaction_past_due = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to past_due
    transactionData.status = "past_due";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction past due successfully:", result[0]);
    return {
      success: true,
      message: "Transaction past due successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction past due webhook:", error);
    throw error;
  }
};

export const handle_webhook_transaction_payment_failed = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to payment_failed
    transactionData.status = "payment_failed";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction payment failed successfully:", result[0]);
    return {
      success: true,
      message: "Transaction payment failed successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction payment failed webhook:", error);
    throw error;
  }
};

export const handle_webhook_transaction_revised = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    let userId = data.custom_data?.userId;
    if (!userId) {
      userId = await getUserIdFromSubscriptionOrCustomer(
        supabase,
        data.subscription_id,
        data.customer_id
      );
    }
    if (!userId) {
      console.warn("Skipping transaction insert: could not determine user_id", {
        subscription_id: data.subscription_id,
        customer_id: data.customer_id,
        paddle_transaction_id: data.id,
        event_type: body.event_type,
      });
      return {
        success: true,
        message: "Transaction skipped: user_id not found",
      };
    }
    const transactionData = {
      ...extractTransactionData(data),
      user_id: userId,
    };
    // Update status to revised
    transactionData.status = "revised";
    const result = await upsertTransaction(transactionData, supabase);
    console.log("Transaction revised successfully:", result[0]);
    return {
      success: true,
      message: "Transaction revised successfully",
      transaction: result[0],
    };
  } catch (error) {
    console.error("Error handling transaction revised webhook:", error);
    throw error;
  }
};
