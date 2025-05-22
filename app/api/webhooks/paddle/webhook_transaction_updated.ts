// import { SupabaseClient } from "@supabase/supabase-js";

// export const handle_webhook_transaction_updated = async (
//   body: string,
//   supabase: SupabaseClient
// ) => {
//   interface CreateTransaction {
//     user_id: string;
//     subscription_id: string;
//     paddle_transaction_id: string;
//     amount: number;
//     currency: string;
//     status: string;
//     invoice_id?: string;
//     invoice_number?: string;
//   }

//   try {
//     const webhookData = JSON.parse(body);
//     const subscriptionData = webhookData.data;

//     // Extract required fields from transaction data
//     const transactionId = subscriptionData.id;
//     const subscriptionId = subscriptionData.subscription_id;
//     const userId = subscriptionData.custom_data?.userId;
//     const status = subscriptionData.status;
//     const currencyCode = subscriptionData.currency_code;

//     // Get total amount from transaction details
//     const totalAmount = parseFloat(
//       subscriptionData.details?.totals?.total || "0"
//     );

//     // Check for missing required fields
//     const missingFields: string[] = [];

//     if (!transactionId) missingFields.push("transaction_id");
//     if (!subscriptionId) missingFields.push("subscription_id");
//     if (!userId) missingFields.push("user_id");
//     if (!status) missingFields.push("status");
//     if (!currencyCode) missingFields.push("currency_code");
//     if (totalAmount === 0) missingFields.push("amount");

//     // Check for invoice fields (these indicate transaction is finalized)
//     const invoiceId = subscriptionData.invoice_id;
//     const invoiceNumber = subscriptionData.invoice_number;

//     if (!invoiceId) missingFields.push("invoice_id");
//     if (!invoiceNumber) missingFields.push("invoice_number");

//     // If any required fields are missing, log and return
//     if (missingFields.length > 0) {
//       console.log(
//         `Waiting for transaction to finalize. Missing fields: ${missingFields.join(
//           ", "
//         )}`
//       );
//       return { success: false, message: "Transaction not yet finalized" };
//     }

//     // Transaction is finalized, proceed with database insertion
//     const transactionData: CreateTransaction = {
//       user_id: userId,
//       subscription_id: subscriptionId,
//       paddle_transaction_id: transactionId,
//       amount: totalAmount,
//       currency: currencyCode,
//       status: status,
//       invoice_id: invoiceId,
//       invoice_number: invoiceNumber,
//     };

//     console.log(
//       "Transaction finalized, inserting into database:",
//       transactionData
//     );

//     // Insert into Supabase
//     const { data, error } = await supabase
//       .from("transactions") // Adjust table name as needed
//       .insert([transactionData])
//       .select();

//     if (error) {
//       console.error("Error inserting transaction:", error);
//       throw error;
//     }

//     console.log("Transaction successfully inserted:", data);
//     return { success: true, data: data };
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     throw error;
//   }
// };
