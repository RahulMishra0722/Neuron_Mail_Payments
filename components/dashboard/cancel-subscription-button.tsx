"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CancelSubscriptionButtonProps {
    subscriptionId: string
    subscription: any
    transactionId: string
}

export default function CancelSubscriptionButton({
    subscriptionId,
    subscription,
    transactionId,
}: CancelSubscriptionButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const { toast } = useToast()

    const handleCancelSubscription = async () => {
        try {
            setIsLoading(true)

            const response = await fetch("/api/paddle/cancel-subscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subscriptionId,
                    transactionId,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel subscription")
            }

            toast({
                title: "Subscription canceled",
                description: "Your subscription has been successfully canceled.",
            })

            // Close the dialog and reload the page to reflect changes
            setIsOpen(false)
            window.location.reload()
        } catch (error) {
            console.error("Error canceling subscription:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to cancel subscription",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
                    Cancel Subscription
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel your subscription? You will lose access to premium features at the end of
                        your current billing period.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 my-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-500">Important information</h3>
                            <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                <p>
                                    Your subscription will remain active until the end of the current billing period (
                                    {subscription?.current_period_end
                                        ? new Date(subscription.current_period_end).toLocaleDateString()
                                        : "N/A"}
                                    ).
                                </p>
                                <p className="mt-1">You can resubscribe at any time.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Keep Subscription
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleCancelSubscription} disabled={isLoading}>
                        {isLoading ? "Canceling..." : "Confirm Cancellation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
