"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, CreditCard } from "lucide-react";

interface Subscription {
    id: string;
    user_id: string;
    paddle_subscription_id?: string;
    paddle_customer_id?: string;
    status?: string;
    plan_id?: string;
    current_period_start?: string | null;
    current_period_end?: string | null;
    canceled_at?: string | null;
    created_at?: string;
    updated_at?: string;
    price?: number;
    currency_code?: string;
}

interface CancelSubscriptionButtonProps {
    subscriptionId: string;
    className?: string;
    subscription: Subscription;
    transactionId?: string;
}

type DialogStep = "cancel" | "success" | "refund";

export default function CancelSubscriptionButton({
    subscriptionId,
    className = "",
    subscription,
    transactionId
}: CancelSubscriptionButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<DialogStep>("cancel");
    const [isLoading, setIsLoading] = useState(false);
    const [cancelType, setCancelType] = useState<"immediate" | "next_billing_period">("next_billing_period");
    const [cancellationResult, setCancellationResult] = useState<{
        type: "immediate" | "next_billing_period";
        eligibleForRefund: boolean;
    } | null>(null);

    // Check if subscription is eligible for refund (within 7 days)
    const isEligibleForRefund = () => {
        if (!subscription.created_at) return false;
        const createdDate = new Date(subscription.created_at);
        const now = new Date();
        const daysDifference = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        return daysDifference <= 7;
    };

    const formatCurrency = (amount?: number, currency?: string) => {
        if (!amount) return "the full amount";
        return `${currency === "USD" ? "$" : ""}${amount}${currency !== "USD" ? ` ${currency}` : ""}`;
    };

    const resetDialog = () => {
        setCurrentStep("cancel");
        setCancellationResult(null);
        setIsLoading(false);
        setCancelType("next_billing_period");
    };

    const handleDialogClose = () => {
        setOpen(false);
        setTimeout(resetDialog, 200); // Reset after animation
    };

    const handleCancel = async () => {
        if (!subscriptionId) {
            toast({
                title: "Error",
                description: "No subscription ID found",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch("/api/paddle/subscriptions/cancel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subscriptionId,
                    effectiveFrom: cancelType
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel subscription");
            }

            // Set cancellation result and move to success step
            setCancellationResult({
                type: cancelType,
                eligibleForRefund: isEligibleForRefund() && !!transactionId
            });
            setCurrentStep("success");

        } catch (error) {
            console.error("Error cancelling subscription:", error);
            toast({
                title: "Cancellation Error",
                description: error instanceof Error ? error.message : "There was an error cancelling your subscription",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!transactionId) {
            toast({
                title: "Error",
                description: "No transaction ID found for refund",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch("/api/paddle/subscriptions/refund", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    transactionId,
                    reason: "requested_by_customer",
                    amount: subscription.price
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process refund");
            }

            toast({
                title: "Refund Processed",
                description: `Your refund of ${formatCurrency(subscription.price, subscription.currency_code)} has been processed successfully`,
                variant: "default",
            });

            handleDialogClose();
            router.refresh();

        } catch (error) {
            console.error("Error processing refund:", error);
            toast({
                title: "Refund Error",
                description: error instanceof Error ? error.message : "There was an error processing your refund",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = () => {
        handleDialogClose();
        router.refresh();
    };

    const renderCancelStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Cancel Subscription
                </DialogTitle>
                <DialogDescription>
                    Choose when you'd like your subscription to end. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>

            <div className="py-6">
                <RadioGroup value={cancelType} onValueChange={(value: "immediate" | "next_billing_period") => setCancelType(value)}>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                            <RadioGroupItem value="next_billing_period" id="next_billing_period" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="next_billing_period" className="text-base font-medium cursor-pointer">
                                    End at billing period
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                    Continue access until {subscription.current_period_end
                                        ? new Date(subscription.current_period_end).toLocaleDateString()
                                        : "your current period ends"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                            <RadioGroupItem value="immediate" id="immediate" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="immediate" className="text-base font-medium cursor-pointer">
                                    Cancel immediately
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                    Lose access to premium features right now
                                </p>
                            </div>
                        </div>
                    </div>
                </RadioGroup>
            </div>

            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                    Keep Subscription
                </Button>
                <Button
                    onClick={handleCancel}
                    variant="destructive"
                    disabled={isLoading}
                    className="min-w-[140px]"
                >
                    {isLoading ? "Cancelling..." : "Cancel Subscription"}
                </Button>
            </DialogFooter>
        </>
    );

    const renderSuccessStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Subscription Cancelled
                </DialogTitle>
                <DialogDescription>
                    Your subscription has been successfully cancelled.
                </DialogDescription>
            </DialogHeader>

            <div className="py-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-green-800">
                        {cancellationResult?.type === "immediate"
                            ? "Your subscription ended immediately. You no longer have access to premium features."
                            : `Your subscription will end on ${subscription.current_period_end
                                ? new Date(subscription.current_period_end).toLocaleDateString()
                                : "your current billing date"}. You'll retain access until then.`
                        }
                    </p>
                </div>

                {cancellationResult?.eligibleForRefund && (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-start gap-3">
                            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium text-blue-900 mb-2">
                                    Refund Available
                                </h4>
                                <p className="text-sm text-blue-800 mb-4">
                                    Since you subscribed within the last 7 days, you can request a full refund of{' '}
                                    {formatCurrency(subscription.price, subscription.currency_code)}.
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleRefund}
                                        disabled={isLoading}
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isLoading ? "Processing..." : "Request Refund"}
                                    </Button>
                                    <Button
                                        onClick={handleFinish}
                                        variant="outline"
                                        size="sm"
                                        disabled={isLoading}
                                    >
                                        No Thanks
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!cancellationResult?.eligibleForRefund && (
                <DialogFooter>
                    <Button onClick={handleFinish} className="w-full">
                        Done
                    </Button>
                </DialogFooter>
            )}
        </>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={`text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 ${className}`}
                >
                    Cancel Subscription
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                {currentStep === "cancel" && renderCancelStep()}
                {currentStep === "success" && renderSuccessStep()}
            </DialogContent>
        </Dialog>
    );
}