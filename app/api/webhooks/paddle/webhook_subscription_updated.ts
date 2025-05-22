import { SupabaseClient } from "@supabase/supabase-js";

interface SubscriptionInsert {
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  plan_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  price: number | null;
  currency_code: string;
}

export const handle_subscription_activated = async (
  obj: any,
  supabase: SupabaseClient
) => {
  try {
    if (!obj?.data) {
      throw new Error("Invalid webhook payload structure");
    }

    const data = obj.data;

    if (!data.custom_data?.userId) {
      throw new Error("Missing userId in custom_data");
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("No subscription items found");
    }

    const subscriptionData: SubscriptionInsert = {
      user_id: data.custom_data.userId,
      paddle_subscription_id: data.id,
      paddle_customer_id: data.customer_id,
      status: data.status,
      plan_id: data.items[0].price.id,
      price: parseFloat(data.items[0].price.unit_price.amount) / 100,
      currency_code: data.currency_code,
      current_period_start: data.current_billing_period?.starts_at || null,
      current_period_end: data.current_billing_period?.ends_at || null,
      canceled_at: data.canceled_at,
    };

    const { data: insertedData, error } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log("Subscription activated successfully:", insertedData);
    return { success: true, data: insertedData };
  } catch (error) {
    console.error("Error handling subscription activation:", error);
    throw error;
  }
};

export const handle_webhook_subscription_canceled = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    const paddleSubscriptionId = data.id;

    if (!paddleSubscriptionId) {
      throw new Error("No subscription ID found in webhook data");
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update({
        status: data.status,
        canceled_at: data.canceled_at,
        current_period_start: data.current_billing_period?.starts_at || null,
        current_period_end: data.current_billing_period?.ends_at || null,
      })
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .select();

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    if (!updatedSubscription || updatedSubscription.length === 0) {
      console.warn(
        `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
      );
      return {
        success: false,
        message: "Subscription not found",
        paddleSubscriptionId,
      };
    }

    console.log("Subscription successfully canceled:", updatedSubscription[0]);
    return {
      success: true,
      message: "Subscription canceled successfully",
      subscription: updatedSubscription[0],
    };
  } catch (error) {
    console.error("Error handling subscription cancellation webhook:", error);
    throw error;
  }
};

export const handle_webhook_subscription_resumed = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    const paddleSubscriptionId = data.id;

    if (!paddleSubscriptionId) {
      throw new Error("No subscription ID found in webhook data");
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update({
        status: data.status,
        canceled_at: null, // Clear canceled_at when resumed
        current_period_start: data.current_billing_period?.starts_at || null,
        current_period_end: data.current_billing_period?.ends_at || null,
        next_billed_at: data.next_billed_at,
      })
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .select();

    if (error) {
      console.error("Error updating subscription to resumed:", error);
      throw error;
    }

    if (!updatedSubscription || updatedSubscription.length === 0) {
      console.warn(
        `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
      );
      return {
        success: false,
        message: "Subscription not found",
        paddleSubscriptionId,
      };
    }

    console.log("Subscription successfully resumed:", updatedSubscription[0]);
    return {
      success: true,
      message: "Subscription resumed successfully",
      subscription: updatedSubscription[0],
    };
  } catch (error) {
    console.error("Error handling subscription resumption webhook:", error);
    throw error;
  }
};

export const handle_webhook_subscription_trialing = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    const paddleSubscriptionId = data.id;

    if (!paddleSubscriptionId) {
      throw new Error("No subscription ID found in webhook data");
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update({
        status: data.status,
        current_period_start: data.current_billing_period?.starts_at || null,
        current_period_end: data.current_billing_period?.ends_at || null,
        next_billed_at: data.next_billed_at,
        canceled_at: null,
      })
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .select();

    if (error) {
      console.error("Error updating subscription to trialing:", error);
      throw error;
    }

    if (!updatedSubscription || updatedSubscription.length === 0) {
      console.warn(
        `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
      );
      return {
        success: false,
        message: "Subscription not found",
        paddleSubscriptionId,
      };
    }

    console.log(
      "Subscription successfully set to trialing:",
      updatedSubscription[0]
    );
    return {
      success: true,
      message: "Subscription set to trialing successfully",
      subscription: updatedSubscription[0],
    };
  } catch (error) {
    console.error("Error handling subscription trialing webhook:", error);
    throw error;
  }
};

export const handle_webhook_subscription_updated = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    const paddleSubscriptionId = data.id;

    if (!paddleSubscriptionId) {
      throw new Error("No subscription ID found in webhook data");
    }

    // Build update object with available fields
    const updateData: any = {
      status: data.status,
      current_period_start: data.current_billing_period?.starts_at || null,
      current_period_end: data.current_billing_period?.ends_at || null,
      next_billed_at: data.next_billed_at,
    };

    // Update price and plan if items are available
    if (data.items && data.items.length > 0) {
      updateData.plan_id = data.items[0].price.id;
      updateData.price =
        parseFloat(data.items[0].price.unit_price.amount) / 100;
      updateData.currency_code = data.currency_code;
    }

    // Update canceled_at if present
    if (data.canceled_at !== undefined) {
      updateData.canceled_at = data.canceled_at;
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .select();

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    if (!updatedSubscription || updatedSubscription.length === 0) {
      console.warn(
        `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
      );
      return {
        success: false,
        message: "Subscription not found",
        paddleSubscriptionId,
      };
    }

    console.log("Subscription successfully updated:", updatedSubscription[0]);
    return {
      success: true,
      message: "Subscription updated successfully",
      subscription: updatedSubscription[0],
    };
  } catch (error) {
    console.error("Error handling subscription update webhook:", error);
    throw error;
  }
};

export const handle_webhook_subscription_past_due = async (
  body: any,
  supabase: SupabaseClient
) => {
  try {
    const data = body.data;
    const paddleSubscriptionId = data.id;

    if (!paddleSubscriptionId) {
      throw new Error("No subscription ID found in webhook data");
    }

    const { data: updatedSubscription, error } = await supabase
      .from("subscriptions")
      .update({
        status: data.status, // "past_due"
        current_period_start: data.current_billing_period?.starts_at || null,
        current_period_end: data.current_billing_period?.ends_at || null,
        next_billed_at: data.next_billed_at,
      })
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .select();

    if (error) {
      console.error("Error updating subscription to past due:", error);
      throw error;
    }

    if (!updatedSubscription || updatedSubscription.length === 0) {
      console.warn(
        `No subscription found with paddle_subscription_id: ${paddleSubscriptionId}`
      );
      return {
        success: false,
        message: "Subscription not found",
        paddleSubscriptionId,
      };
    }

    console.log(
      "Subscription successfully set to past due:",
      updatedSubscription[0]
    );
    return {
      success: true,
      message: "Subscription set to past due successfully",
      subscription: updatedSubscription[0],
    };
  } catch (error) {
    console.error("Error handling subscription past due webhook:", error);
    throw error;
  }
};
