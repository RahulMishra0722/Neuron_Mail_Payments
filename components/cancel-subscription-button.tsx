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

interface CancelSubscriptionButtonProps {
    subscriptionId: string;
    className?: string;
}

export default function CancelSubscriptionButton({
    subscriptionId,
    className = ""
}: CancelSubscriptionButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [cancelType, setCancelType] = useState<"immediate" | "next_billing_period">("next_billing_period");

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

            // Call our API route instead of direct Paddle API
            const response = await fetch("/api/subscriptions/cancel", {
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

            setOpen(false);
            toast({
                title: "Subscription cancelled",
                description: cancelType === "immediate"
                    ? "Your subscription has been cancelled immediately"
                    : "Your subscription will end at the current billing period",
                variant: "default",
            });

            // Refresh the page to show updated subscription status
            router.refresh();
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                        Please choose when you would like your subscription to end.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <RadioGroup value={cancelType} onValueChange={(value: "immediate" | "next_billing_period") => setCancelType(value)}>
                        <div className="flex items-start space-x-2 mb-4 border rounded-md p-3 hover:bg-gray-50">
                            <RadioGroupItem value="next_billing_period" id="next_billing_period" />
                            <div className="space-y-1">
                                <Label htmlFor="next_billing_period" className="font-medium">
                                    End of current billing period
                                </Label>
                                <p className="text-sm text-gray-500">
                                    You'll continue to have access to premium features until your current billing period ends.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-2 border rounded-md p-3 hover:bg-gray-50">
                            <RadioGroupItem value="immediate" id="immediate" />
                            <div className="space-y-1">
                                <Label htmlFor="immediate" className="font-medium">
                                    Cancel immediately
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Your subscription will end now and you'll lose access to premium features immediately.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Keep Subscription
                    </Button>
                    <Button
                        onClick={handleCancel}
                        variant="destructive"
                        disabled={isLoading}
                    >
                        {isLoading ? "Cancelling..." : "Confirm Cancellation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}