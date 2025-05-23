"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, ArrowRight, Calendar, CheckCircle, CreditCard } from 'lucide-react'
import { cn } from "@/lib/utils"

interface Subscription {
    id: string
    user_id: string
    paddle_subscription_id?: string
    paddle_customer_id?: string
    status?: string
    plan_id?: string
    current_period_start?: string | null
    current_period_end?: string | null
    canceled_at?: string | null
    created_at?: string
    updated_at?: string
    price?: number
    currency_code?: string
}

interface CancelSubscriptionButtonProps {
    subscriptionId: string
    className?: string
    subscription: Subscription
    transactionId?: string
}

type DialogStep = "cancel" | "success" | "refund"

export default function CancelSubscriptionButton({
    subscriptionId,
    className = "",
    subscription,
    transactionId,
}: CancelSubscriptionButtonProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState<DialogStep>("cancel")
    const [isLoading, setIsLoading] = useState(false)
    const [cancelType, setCancelType] = useState<"immediate" | "next_billing_period">("next_billing_period")
    const [cancellationResult, setCancellationResult] = useState<{
        type: "immediate" | "next_billing_period"
        eligibleForRefund: boolean
    } | null>(null)

    const isTrialing = subscription.status?.toLowerCase() === "trialing"

    // Check if subscription is eligible for refund (within 7 days)
    const isEligibleForRefund = () => {
        if (!subscription.created_at || isTrialing) return false
        const createdDate = new Date(subscription.created_at)
        const now = new Date()
        const daysDifference = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)
        return daysDifference <= 7
    }

    const formatCurrency = (amount?: number, currency?: string) => {
        if (!amount) return "the full amount"
        const formatter = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
        })
        return formatter.format(amount)
    }

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "Unknown date"
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(dateString))
    }

    const getStatusStyles = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "trialing":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "canceled":
                return "bg-red-100 text-red-800 border-red-200"
            case "past_due":
                return "bg-amber-100 text-amber-800 border-amber-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getDaysUntilTrialEnd = () => {
        if (!subscription.current_period_end || !isTrialing) return null
        const endDate = new Date(subscription.current_period_end)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const getDaysUntilRenewal = () => {
        if (!subscription.current_period_end || isTrialing) return null
        const endDate = new Date(subscription.current_period_end)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : 0
    }

    const resetDialog = () => {
        setCurrentStep("cancel")
        setCancellationResult(null)
        setIsLoading(false)
        setCancelType("next_billing_period")
    }

    const handleDialogClose = () => {
        setOpen(false)
        setTimeout(resetDialog, 200)
    }

    const handleCancel = async () => {
        if (!subscriptionId) {
            toast({
                title: "Error",
                description: "No subscription ID found",
                variant: "destructive",
            })
            return
        }

        try {
            setIsLoading(true)

            const response = await fetch("/api/paddle/subscriptions/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subscriptionId,
                    effectiveFrom: cancelType,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel subscription")
            }

            setCancellationResult({
                type: cancelType,
                eligibleForRefund: isEligibleForRefund() && !!transactionId,
            })
            setCurrentStep("success")
        } catch (error) {
            console.error("Error cancelling subscription:", error)
            toast({
                title: "Cancellation Error",
                description: error instanceof Error ? error.message : "There was an error cancelling your subscription",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefund = async () => {
        if (!transactionId) {
            toast({
                title: "Error",
                description: "No transaction ID found for refund",
                variant: "destructive",
            })
            return
        }

        try {
            setIsLoading(true)

            const response = await fetch("/api/paddle/subscriptions/refund", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transactionId,
                    reason: "requested_by_customer",
                    amount: subscription.price,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to process refund")
            }

            toast({
                title: "Refund Processed",
                description: `Your refund of ${formatCurrency(subscription.price, subscription.currency_code)} has been processed successfully`,
                variant: "default",
            })

            handleDialogClose()
            router.refresh()
        } catch (error) {
            console.error("Error processing refund:", error)
            toast({
                title: "Refund Error",
                description: error instanceof Error ? error.message : "There was an error processing your refund",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinish = () => {
        handleDialogClose()
        router.refresh()
    }

    const renderCancelStep = () => (
        <div className="flex flex-col h-full">
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
                {isTrialing ? "Cancel Trial" : "Cancel Subscription"}
            </DialogTitle>

            {/* Subscription Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-500">Current Plan</div>
                    <div
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-full border",
                            getStatusStyles(subscription.status),
                        )}
                    >
                        {isTrialing ? "Trial" : subscription.status || "Active"}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(subscription.price, subscription.currency_code)}/month
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        {isTrialing
                            ? `Trial ends ${formatDate(subscription.current_period_end)}`
                            : `Renews ${formatDate(subscription.current_period_end)}`}
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-2">How would you like to cancel?</h3>
                <RadioGroup
                    value={cancelType}
                    onValueChange={(value: "immediate" | "next_billing_period") => setCancelType(value)}
                    className="space-y-3"
                >
                    <div
                        className={cn(
                            "relative border rounded-lg p-4 cursor-pointer transition-all",
                            cancelType === "next_billing_period"
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() => setCancelType("next_billing_period")}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="next_billing_period" id="next_billing_period" className="mt-0.5" />
                            <div>
                                <Label htmlFor="next_billing_period" className="text-base font-medium text-gray-900 cursor-pointer">
                                    {isTrialing ? "End after trial period" : "End at billing period"}
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                    {isTrialing
                                        ? `You'll have access until ${formatDate(subscription.current_period_end)}`
                                        : `You'll have access until ${formatDate(subscription.current_period_end)}`}
                                </p>
                                {cancelType === "next_billing_period" && (
                                    <div className="mt-2 text-xs font-medium text-gray-500 flex items-center">
                                        <CheckCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                        Recommended
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className={cn(
                            "relative border rounded-lg p-4 cursor-pointer transition-all",
                            cancelType === "immediate" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300",
                        )}
                        onClick={() => setCancelType("immediate")}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="immediate" id="immediate" className="mt-0.5" />
                            <div>
                                <Label htmlFor="immediate" className="text-base font-medium text-gray-900 cursor-pointer">
                                    Cancel immediately
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                    {isTrialing
                                        ? "Your trial will end now and you'll lose access immediately"
                                        : "Your subscription will end now and you'll lose access immediately"}
                                </p>
                                {cancelType === "immediate" && (
                                    <div className="mt-2 text-xs font-medium text-gray-500 flex items-center">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                        Access ends immediately
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            {isEligibleForRefund() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-gray-900 mb-1">Refund Available</h4>
                            <p className="text-sm text-gray-500">
                                You'll be eligible for a refund after cancellation since you subscribed within the last 7 days.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={handleDialogClose}
                        disabled={isLoading}
                        className="sm:flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                        Keep {isTrialing ? "Trial" : "Subscription"}
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="sm:flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <>
                                Confirm Cancellation
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )

    const renderSuccessStep = () => (
        <div className="flex flex-col h-full">
            <DialogTitle className="text-xl font-semibold text-gray-900 mb-6">
                Cancellation Confirmed
            </DialogTitle>

            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-gray-900" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isTrialing ? "Trial Cancelled" : "Subscription Cancelled"}
                </h3>
                <p className="text-gray-500 max-w-sm">
                    {cancellationResult?.type === "immediate"
                        ? "Your cancellation has been processed and access has ended."
                        : `Your cancellation has been processed. You'll have access until ${formatDate(subscription.current_period_end)}.`}
                </p>
            </div>

            {cancellationResult?.eligibleForRefund && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-5 w-5 text-gray-900" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">Refund Available</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                Since you subscribed within the last 7 days, you're eligible for a refund of{" "}
                                <span className="font-medium">{formatCurrency(subscription.price, subscription.currency_code)}</span>.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleRefund}
                                    disabled={isLoading}
                                    className="bg-gray-900 hover:bg-gray-800 text-white"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        "Request Refund"
                                    )}
                                </Button>
                                <Button
                                    onClick={handleFinish}
                                    variant="outline"
                                    disabled={isLoading}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    No Refund Needed
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!cancellationResult?.eligibleForRefund && (
                <div className="mt-auto pt-6 border-t border-gray-200">
                    <Button onClick={handleFinish} className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                        Close
                    </Button>
                </div>
            )}
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "text-red-400 border-red-400 transition-colors",
                        className,
                    )}
                >
                    {isTrialing ? "Cancel Trial" : "Cancel Subscription"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-6">
                {currentStep === "cancel" && renderCancelStep()}
                {currentStep === "success" && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    )
}