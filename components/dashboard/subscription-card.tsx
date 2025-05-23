import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import CancelSubscriptionButton from "../cancel-subscription-button"

interface SubscriptionCardProps {
    subscription: any
    isSubscribed: boolean
    isTrialing: boolean
    isCanceled: boolean
    daysRemaining: number
    subDetails: any
    formattedDates: {
        currentPeriodStart: string
        currentPeriodEnd: string
        canceledAt: string
        createdAt: string
    }
    transactionId?: string
}

export function SubscriptionCard({
    subscription,
    isSubscribed,
    isTrialing,
    isCanceled,
    daysRemaining,
    subDetails,
    formattedDates,
    transactionId,
}: SubscriptionCardProps) {
    // Check if we have a canceled subscription
    const hasCanceledSubscription = subscription && (isCanceled || subscription.status === "canceled")
    console.log({})
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Subscription Status</CardTitle>
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent>
                {hasCanceledSubscription ? (
                    <div>
                        {/* Canceled Status Alert */}
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-destructive">Subscription Canceled</h3>
                                    <div className="mt-2 text-sm text-destructive/80">
                                        <p>Your subscription was canceled on {formattedDates.canceledAt}.</p>
                                        <p className="mt-1">You can subscribe to a new plan to regain access to premium features.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 mr-2">
                                Canceled
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Previous Plan</p>
                                    <p className="text-foreground text-lg font-medium">{subDetails?.planName || "Premium Plan"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Was Billing</p>
                                    <p className="text-foreground">
                                        {subDetails?.amount || `$${subscription.price}`}{" "}
                                        {subDetails?.currency || subscription.currency_code} / {subDetails?.interval || "month"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Canceled Date</p>
                                    <p className="text-foreground">{formattedDates.canceledAt}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
                                    <p className="text-foreground text-xs font-mono">{subscription.paddle_subscription_id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/pricing">
                                <Button>Subscribe to New Plan</Button>
                            </Link>
                            <Link href="/pricing">
                                <Button variant="outline">View Available Plans</Button>
                            </Link>
                        </div>
                    </div>
                ) : isSubscribed ? (
                    <div>
                        <div className="flex items-center mb-6">
                            <Badge variant={isTrialing ? "secondary" : "default"} className="mr-2">
                                {isTrialing ? "Trial" : "Active"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Plan</p>
                                    <p className="text-foreground text-lg font-medium">{subDetails?.planName}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Billing</p>
                                    <p className="text-foreground">
                                        {subDetails?.amount} {subDetails?.currency} / {subDetails?.interval}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <p className="text-sm font-medium text-muted-foreground">Current Period</p>
                                        <p className="text-sm text-muted-foreground">{daysRemaining} days left</p>
                                    </div>
                                    <Progress value={Math.max(0, Math.min(100, (daysRemaining / 30) * 100))} className="h-2" />
                                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                        <p>Started: {formattedDates.currentPeriodStart}</p>
                                        <p>Next billing: {formattedDates.currentPeriodEnd}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                                    <p className="text-foreground">•••• •••• •••• 4242</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {subscription?.paddle_subscription_id && transactionId && (
                                <CancelSubscriptionButton
                                    subscriptionId={subscription.paddle_subscription_id}
                                    subscription={subscription}
                                    transactionId={transactionId}
                                />
                            )}
                            <Link href="/billing/update-payment">
                                <Button variant="outline">Update Payment Method</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-500">No active subscription</h3>
                                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                        <p>Subscribe to our premium plan to access all features and benefits.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link href="/pricing">
                                <Button className="w-full md:w-auto">View Pricing Plans</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
