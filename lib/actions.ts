"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("Starting signup process for:", email);

  try {
    // Create the user account
    console.log("Attempting user signup...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      }
    );

    console.log("Signup response:", {
      user: signUpData?.user?.id,
      session: !!signUpData?.session,
      error: signUpError?.message,
    });

    if (signUpError) {
      console.error("Supabase auth error:", signUpError);

      // Handle specific Supabase auth errors
      if (signUpError.message.includes("already registered")) {
        return {
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }

      // Handle rate limiting
      if (signUpError.message.includes("rate limit")) {
        return {
          error:
            "Too many signup attempts. Please wait a few minutes and try again.",
        };
      }

      // Handle weak password
      if (signUpError.message.includes("Password should be")) {
        return {
          error: signUpError.message,
        };
      }

      return {
        error:
          signUpError.message || "Failed to create account. Please try again.",
      };
    }

    if (!signUpData.user) {
      console.error("No user data returned from signup");
      return {
        error: "Failed to create account. Please try again.",
      };
    }

    console.log(
      "User created successfully! Profile will be created by database trigger."
    );

    console.log("Revalidating path and determining response...");
    revalidatePath("/", "layout");

    // Handle auto-confirmation vs. email verification
    const requiresEmailConfirmation = !signUpData.session;

    if (requiresEmailConfirmation) {
      console.log("Email confirmation required");
      return {
        success: "Account created! Please check your email for verification.",
      };
    } else {
      console.log("Account created and auto-confirmed");
      return {
        success: "Account created successfully!",
      };
    }
  } catch (error: any) {
    console.error("Signup outer catch error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
    });

    // Provide more specific error messages based on error type
    if (error?.code === "ENOTFOUND" || error?.message?.includes("fetch")) {
      return {
        error: "Network error. Please check your connection and try again.",
      };
    }

    if (error?.message?.includes("JWT")) {
      return {
        error: "Authentication error. Please try again.",
      };
    }

    return {
      error: `Database error: ${error?.message || "Unknown error occurred"}`,
    };
  }
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
