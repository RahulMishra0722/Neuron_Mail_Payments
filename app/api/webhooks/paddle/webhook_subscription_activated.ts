// import { SupabaseClient } from "@supabase/supabase-js";

// // Move interface outside of function for reusability
// interface SubscriptionInsert {
//   user_id: string;
//   paddle_subscription_id: string;
//   paddle_customer_id: string;
//   status: "active" | "canceled" | "past_due" | "trialing" | "paused";
//   plan_id: string;
//   current_period_start: string | null;
//   current_period_end: string | null;
//   canceled_at: string | null;
//   price: number | null;
//   currency_code:
//     | "USD"
//     | "EUR"
//     | "GBP"
//     | "JPY"
//     | "AUD"
//     | "CAD"
//     | "CHF"
//     | "HKD"
//     | "SGD"
//     | "SEK"
//     | "AED"
//     | "ARS"
//     | "BRL"
//     | "BGN"
//     | "CLP"
//     | "CNY"
//     | "COP"
//     | "CZK"
//     | "DKK"
//     | "EGP"
//     | "HUF"
//     | "INR"
//     | "ILS"
//     | "KRW"
//     | "KWD"
//     | "MXN"
//     | "MAD"
//     | "NOK"
//     | "NZD"
//     | "PEN"
//     | "PHP"
//     | "PLN"
//     | "QAR"
//     | "RON"
//     | "RUB"
//     | "SAR"
//     | "ZAR"
//     | "LKR"
//     | "THB"
//     | "TRY"
//     | "TWD"
//     | "UAH"
//     | "UYU"
//     | "VND";
// }

// export const handle_subscription_activated = async (
//   obj: any,
//   supabase: SupabaseClient
// ) => {
//   try {
//     console.log(`----------------------------------`);
//     console.log({ activated: JSON.stringify(obj) });
//     console.log(JSON.stringify(obj));
//     console.log(`----------------------------------`);
//     if (!obj?.data) {
//       throw new Error("Invalid webhook payload structure");
//     }

//     const data = obj.data;

//     // Check for required fields
//     if (!data.custom_data?.userId) {
//       throw new Error("Missing userId in custom_data");
//     }

//     if (!data.items || data.items.length === 0) {
//       throw new Error("No subscription items found");
//     }

//     const subscriptionData: SubscriptionInsert = {
//       user_id: data.custom_data.userId,
//       paddle_subscription_id: data.id,
//       paddle_customer_id: data.customer_id,
//       status: data.status,
//       plan_id: data.items[0].price.id,
//       price: parseFloat(data.items[0].price.unit_price.amount) / 100,
//       currency_code: data.currency_code,
//       current_period_start: data.current_billing_period?.starts_at || null,
//       current_period_end: data.current_billing_period?.ends_at || null,
//       canceled_at: data.canceled_at,
//     };

//     const { data: insertedData, error } = await supabase
//       .from("subscriptions")
//       .insert(subscriptionData)
//       .select();

//     if (error) {
//       throw new Error(`Database insert failed: ${error.message}`);
//     }

//     console.log("Subscription activated successfully:", insertedData);
//     return { success: true, data: insertedData };
//   } catch (error) {
//     console.error("Error handling subscription activation:", error);
//     throw error; // Re-throw to let calling code handle it
//   }
// };
