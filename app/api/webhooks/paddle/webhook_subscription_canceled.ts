// import { SupabaseClient } from "@supabase/supabase-js";

// export const handle_webhook_subscription_canceled = async (
//   body: any,
//   supabase: SupabaseClient
// ) => {
//   try {
//     // The webhook body already contains the data object
//     const data = body.data;

//     // Extract the subscription ID from the webhook data
//     const paddleSubscriptionId = data.id;

//     if (!paddleSubscriptionId) {
//       throw new Error("No subscription ID found in webhook data");
//     }

//     // Update the subscription in the database
//     const { data: updatedSubscription, error } = await supabase
//       .from("subscriptions") // Replace with your actual table name
//       .update({
//         status: data.status, // "canceled"
//         canceled_at: data.canceled_at,
//         // Update other fields that might have changed
//         current_period_start: data.current_billing_period?.starts_at || null,
//         current_period_end: data.current_billing_period?.ends_at || null,
//       })
//       .eq("paddle_subscription_id", paddleSubscriptionId)
//       .select();

//     if (error) {
//       console.error("Error updating subscription:", error);
//       throw error;
//     }

//     if (!updatedSubscription || updatedSubscription.length === 0) {
//       console.warn(
//         `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
//       );
//       return {
//         success: false,
//         message: "Subscription not found",
//         paddleSubscriptionId,
//       };
//     }

//     console.log("Subscription successfully canceled:", updatedSubscription[0]);

//     return {
//       success: true,
//       message: "Subscription canceled successfully",
//       subscription: updatedSubscription[0],
//     };
//   } catch (error) {
//     console.error("Error handling subscription cancellation webhook:", error);
//     throw error;
//   }
// };
