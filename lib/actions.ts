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

    console.log("User created successfully, creating profile...");

    // Create profile record if user was created successfully
    try {
      const profileData = {
        id: signUpData.user.id,
        email: email.toLowerCase().trim(),
        subscription_active: false,
        is_on_free_trial: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Inserting profile data:", profileData);

      const { error: profileError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (profileError) {
        console.error("Profile creation error:", profileError);

        // Handle specific profile creation errors
        if (profileError.code === "23505") {
          // Duplicate key - profile already exists
          console.log("Profile already exists for user, continuing...");
        } else if (profileError.code === "42P01") {
          // Table doesn't exist
          console.error("Profiles table doesn't exist");
          return {
            error: "Database configuration error. Please contact support.",
          };
        } else if (profileError.code === "42703") {
          // Column doesn't exist
          console.error(
            "Column doesn't exist in profiles table:",
            profileError.message
          );
          return {
            error: "Database schema error. Please contact support.",
          };
        } else {
          console.error("Failed to create profile:", profileError);
          // For now, don't fail the entire signup process
          // The user account was created successfully
          console.log("Continuing despite profile creation error...");
        }
      } else {
        console.log("Profile created successfully");
      }
    } catch (profileErr: any) {
      console.error("Profile creation exception:", profileErr);
      console.error("Profile error details:", {
        message: profileErr?.message,
        code: profileErr?.code,
        details: profileErr?.details,
        hint: profileErr?.hint,
      });

      // Don't fail the signup - user account was created successfully
      console.log("Continuing despite profile creation exception...");
    }

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
