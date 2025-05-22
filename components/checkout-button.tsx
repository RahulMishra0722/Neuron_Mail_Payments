"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createCheckout, type PaddleCheckoutOptions } from "@/lib/paddle"
import { config } from "@/lib/config"

interface CheckoutButtonProps {
  email: string
  userId: string
  className?: string
}

export default function CheckoutButton({ email, userId, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setLoading(true)

      // Configure checkout options
      const checkoutOptions: PaddleCheckoutOptions = {
        items: [
          {
            priceId: config.paddle.planId,
            quantity: 1,
          },
        ],

        successUrl: `${config.app.url}/dashboard?checkout_success=true`,
        cancelUrl: `${config.app.url}/pricing?checkout_canceled=true`,
        customer: {
          id: userId,
          email,
        }
      }
      await createCheckout(checkoutOptions)
    } catch (error) {
      console.error("Checkout error:", error)
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
        `Subscribe for $${config.paddle.price}/${config.paddle.currency}`
      )}
    </Button>
  )
}
