"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { subscriptionPlans } from "@/config/subscription-config"
import CheckoutButton from "@/components/checkout-button"

interface PricingPlansProps {
    userId?: string
    userEmail?: string
    isSubscribed?: boolean
}

export function PricingPlans({ userId, userEmail, isSubscribed = false }: PricingPlansProps) {
    const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

    // Calculate yearly price (20% discount)
    const getYearlyPrice = (monthlyPrice: number) => {
        const yearlyPrice = monthlyPrice * 12 * 0.8
        return Math.round(yearlyPrice)
    }

    return (
        <div className="container px-4 md:px-6 py-12">
            <div className="mx-auto text-center max-w-3xl space-y-4 mb-12">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h1>
                <p className="text-muted-foreground md:text-xl">
                    Choose the plan that works best for your business. All plans include a 7 day free trial.
                </p>

                <div className="flex items-center justify-center space-x-4 mt-8">
                    <Label
                        htmlFor="billing-toggle"
                        className={billingInterval === "monthly" ? "font-medium" : "text-muted-foreground"}
                    >
                        Monthly
                    </Label>
                    <Switch
                        id="billing-toggle"
                        checked={billingInterval === "yearly"}
                        onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
                    />
                    <Label
                        htmlFor="billing-toggle"
                        className={billingInterval === "yearly" ? "font-medium" : "text-muted-foreground"}
                    >
                        Yearly{" "}
                        <Badge variant="outline" className="ml-2 font-normal">
                            Save 20%
                        </Badge>
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {subscriptionPlans.map((plan) => {
                    const price = billingInterval === "yearly" ? getYearlyPrice(plan.price) : plan.price

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col ${plan.highlight ? "border-muted-foreground/20 shadow-md relative overflow-hidden" : ""}`}
                        >
                            {plan.badge && (
                                <div className="absolute top-0 right-0">
                                    <Badge
                                        variant="outline"
                                        className="bg-muted/50 text-muted-foreground rounded-tl-none rounded-br-none rounded-tr-md rounded-bl-md"
                                    >
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                                    ${price}
                                    <span className="ml-1 text-2xl font-medium text-muted-foreground">
                                        /{billingInterval === "monthly" ? "mo" : "yr"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <Check
                                                className={`h-5 w-5 mr-3 flex-shrink-0 ${feature.included ? "text-primary" : "text-muted-foreground/50"
                                                    }`}
                                            />
                                            <span className={feature.included ? "" : "text-muted-foreground/70"}>{feature.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {isSubscribed ? (
                                    <div className="w-full">
                                        <Button variant="outline" className="w-full" disabled>
                                            Current Plan
                                        </Button>
                                    </div>
                                ) : userId && userEmail ? (
                                    <CheckoutButton email={userEmail} userId={userId} className="w-full">
                                        {plan.buttonText}
                                    </CheckoutButton>
                                ) : (
                                    <div className="w-full space-y-3">
                                        <Link href="/auth/signup">
                                            <Button className="w-full">{plan.buttonText}</Button>
                                        </Link>
                                        <p className="text-xs text-center text-muted-foreground">
                                            Includes {plan.trialDays}-day free trial
                                        </p>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
