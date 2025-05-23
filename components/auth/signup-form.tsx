"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signup } from "@/lib/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Create a clean FormData object
      const formData = new FormData()
      formData.append("email", values.email.toLowerCase().trim())
      formData.append("password", values.password)
      formData.append("name", values.name.trim())

      const result = await signup(formData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } catch (err: any) {
      console.error("Client signup error:", err)
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input {...field} className="pl-10" placeholder="John Doe" disabled={loading} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input {...field} type="email" className="pl-10" placeholder="you@example.com" disabled={loading} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      className="pl-10"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-muted-foreground font-normal">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Creating account...
              </div>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative flex items-center justify-center">
        <div className="border-t w-full border-border"></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
        </div>
      </div>

      <div className="text-center">
        <Link href="/auth/login">
          <Button type="button" variant="outline" className="w-full">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
