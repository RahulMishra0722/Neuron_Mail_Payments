import { SupabaseClient } from "@supabase/supabase-js";

export const handle_webhook_transaction_updated = async (
  body: any,
  supabase: SupabaseClient
) => {
  interface CreateTransaction {
    user_id: string;
    subscription_id: string;
    paddle_transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    invoice_id?: string;
    invoice_number?: string;
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
    raw_transaction_data: any; // Stor
  }

  try {
    const subscriptionData = body.data;

    // Extract required fields from transaction data
    const transactionId = subscriptionData.id;
    const subscriptionId = subscriptionData.subscription_id;
    const userId = subscriptionData.custom_data?.userId;
    const status = subscriptionData.status;
    const currencyCode = subscriptionData.currency_code;

    // Get total amount from transaction details
    const totalAmount = parseFloat(
      subscriptionData.details?.totals?.total || "0"
    );

    // Extract additional safety fields
    const billedAt = subscriptionData.billed_at;
    const createdAt = subscriptionData.created_at;
    const updatedAt = subscriptionData.updated_at;
    const customerId = subscriptionData.customer_id;
    const collectionMode = subscriptionData.collection_mode;
    const origin = subscriptionData.origin;

    // Extract detailed totals for audit trail
    const totals = subscriptionData.details?.totals;
    const subtotal = parseFloat(totals?.subtotal || "0");
    const taxTotal = parseFloat(totals?.tax || "0");
    const feeTotal = parseFloat(totals?.fee || "0");
    const discountTotal = parseFloat(totals?.discount || "0");
    const grandTotal = parseFloat(totals?.grand_total || "0");

    // Extract payment information
    const payment = subscriptionData.payments?.[0]; // Get first payment
    const paymentStatus = payment?.status;
    const paymentMethodType = payment?.method_details?.type;

    // Extract billing period
    const billingPeriodStart = subscriptionData.billing_period?.starts_at;
    const billingPeriodEnd = subscriptionData.billing_period?.ends_at;

    // Check for missing required fields
    const missingFields: string[] = [];

    if (!transactionId) missingFields.push("transaction_id");
    if (!subscriptionId) missingFields.push("subscription_id");
    if (!userId) missingFields.push("user_id");
    if (!status) missingFields.push("status");
    if (!currencyCode) missingFields.push("currency_code");
    if (totalAmount === 0) missingFields.push("amount");

    // Check for invoice fields (these indicate transaction is finalized)
    const invoiceId = subscriptionData.invoice_id;
    const invoiceNumber = subscriptionData.invoice_number;

    if (!invoiceId) missingFields.push("invoice_id");
    if (!invoiceNumber) missingFields.push("invoice_number");

    // If any required fields are missing, log and return
    if (missingFields.length > 0) {
      console.log(
        `Waiting for transaction to finalize. Missing fields: ${missingFields.join(
          ", "
        )}`
      );
      return { success: false, message: "Transaction not yet finalized" };
    }

    // Transaction is finalized, proceed with database insertion
    const transactionData: CreateTransaction = {
      user_id: userId,
      subscription_id: subscriptionId,
      paddle_transaction_id: transactionId,
      amount: totalAmount,
      currency: currencyCode,
      status: status,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      billed_at: billedAt,
      created_at: createdAt,
      updated_at: updatedAt,
      customer_id: customerId,
      collection_mode: collectionMode,
      origin: origin,
      subtotal: subtotal,
      tax_total: taxTotal,
      fee_total: feeTotal,
      discount_total: discountTotal,
      grand_total: grandTotal,
      payment_status: paymentStatus,
      payment_method_type: paymentMethodType,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      raw_transaction_data: subscriptionData, // Store entire transaction for ultimate safety
    };

    console.log(
      "Transaction finalized, inserting into database:",
      transactionData
    );

    // Insert into Supabase
    const { data, error } = await supabase
      .from("transactions") // Adjust table name as needed
      .insert([transactionData])
      .select();

    if (error) {
      console.error("Error inserting transaction:", error);
      throw error;
    }

    console.log("Transaction successfully inserted:", data);
    return { success: true, data: data };
  } catch (error) {
    console.error("Error processing webhook:", error);
    throw error;
  }
};
