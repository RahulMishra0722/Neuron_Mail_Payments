// import { SupabaseClient } from "@supabase/supabase-js";

// export const handle_webhook_subscription_trialing = async (
//   body: any,
//   supabase: SupabaseClient
// ) => {
//   try {
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
//         status: data.status, // "trialing"
//         current_period_start: data.current_billing_period?.starts_at || null,
//         current_period_end: data.current_billing_period?.ends_at || null,
//         next_billed_at: data.next_billed_at,
//         // Clear canceled_at since subscription is now trialing
//         canceled_at: null,
//         // Update trial information if available
//         trial_start_date: data.trial_dates?.starts_at || null,
//         trial_end_date: data.trial_dates?.ends_at || null,
//       })
//       .eq("paddle_subscription_id", paddleSubscriptionId)
//       .select();

//     if (error) {
//       console.error("Error updating subscription to trialing:", error);
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

//     console.log(
//       "Subscription successfully set to trialing:",
//       updatedSubscription[0]
//     );

//     return {
//       success: true,
//       message: "Subscription set to trialing successfully",
//       subscription: updatedSubscription[0],
//     };
//   } catch (error) {
//     console.error("Error handling subscription trialing webhook:", error);
//     throw error;
//   }
// };
