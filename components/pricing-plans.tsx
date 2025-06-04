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

const SUBSCRIPTION_MODE = process.env.NEXT_PUBLIC_SUBSCRIPTION_MODE || "multi";
const SINGLE_PLAN_ID = process.env.NEXT_PUBLIC_SINGLE_PLAN_ID || "professional";

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

    // Filter plans based on mode
    let plansToShow = subscriptionPlans;
    if (SUBSCRIPTION_MODE === "single") {
        plansToShow = subscriptionPlans.filter(plan => plan.id === SINGLE_PLAN_ID);
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

            {/* Center card if single plan mode */}
            <div
                className={`grid ${plansToShow.length === 1
                    ? 'justify-center'
                    : 'grid-cols-1 md:grid-cols-3'
                    } gap-6 max-w-5xl mx-auto`}
            >
                {plansToShow.map((plan) => {
                    // Use the same price as CheckoutButton for consistency
                    const price = billingInterval === "yearly" ? getYearlyPrice(plan.price) : plan.price

                    return (
                        <Card
                            key={plan.id}
                            className={`flex flex-col ${plan.highlight
                                ? "border-muted-foreground/20 shadow-md relative overflow-hidden"
                                : ""
                                } max-w-sm w-full mx-auto p-4`}
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
                            <CardHeader className="pb-2">
                                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                                <CardDescription className="text-base">{plan.description}</CardDescription>
                                <div className="mt-2 flex items-baseline text-4xl font-extrabold">
                                    ${price}
                                    <span className="ml-1 text-lg font-medium text-muted-foreground">
                                        /{billingInterval === "monthly" ? "mo" : "yr"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow py-2">
                                <ul className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <Check
                                                className={`h-4 w-4 mr-2 flex-shrink-0 ${feature.included ? "text-primary" : "text-muted-foreground/50"
                                                    }`}
                                            />
                                            <span className={feature.included ? "" : "text-muted-foreground/70"}>{feature.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-2">
                                {isSubscribed ? (
                                    <div className="w-full">
                                        <Button variant="outline" className="w-full" disabled>
                                            Current Plan
                                        </Button>
                                    </div>
                                ) : userId && userEmail ? (
                                    <CheckoutButton
                                        email={userEmail}
                                        userId={userId}
                                        className="w-full"
                                        isYearly={billingInterval === "yearly"}
                                    />
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
