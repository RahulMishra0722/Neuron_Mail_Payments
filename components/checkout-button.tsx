"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createCheckout, type PaddleCheckoutOptions } from "@/lib/paddle"
import { config } from "@/lib/config"
import { toast } from "@/hooks/use-toast"

interface CheckoutButtonProps {
  email: string
  userId: string
  className?: string
  isYearly: boolean
}

export default function CheckoutButton({ email, userId, className, isYearly }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setLoading(true)

      const checkoutOptions: PaddleCheckoutOptions = {
        successUrl: `${config.app.url}/dashboard`,
        customer: {
          id: userId,
          email,
        }
      }
      await createCheckout(checkoutOptions, isYearly)
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={
        className || "w-full bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 text-lg font-medium rounded-lg h-[60px]"
      }
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Subscribe`
      )}
    </Button>
  )
}