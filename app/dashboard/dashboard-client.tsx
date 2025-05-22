"use client"

import Link from "next/link"
import { LogOut, CreditCard, User, Home, ChevronRight, Shield, CheckCircle, Download, ExternalLink, AlertTriangle } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signout } from "@/lib/actions"
import type { Transaction } from "./transactions"
import CancelSubscriptionButton from "@/components/cancel-subscription-button"

// Type definitions
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

interface UserType {
    id: string
    email: string
    created_at: string
}

interface SubscriptionDetails {
    planName: string
    amount: string
    interval: string
    currency: string
}

interface DashboardProps {
    user: UserType & { formattedCreatedAt: string }
    subscription: Subscription | null
    isSubscribed: boolean
    isTrialing: boolean
    isCanceled: boolean
    daysRemaining: number
    subDetails: SubscriptionDetails | null
    subscriptionTransactions: Transaction[]
    allTransactions: Transaction[]
    formattedDates: {
        currentPeriodStart: string
        currentPeriodEnd: string
        canceledAt: string
        createdAt: string
    }
}

// Component for rendering transaction status badge
function TransactionStatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
    const getStatusColor = () => {
        if (paymentStatus === "paid") return "bg-green-50 text-green-700 border-green-200"
        if (paymentStatus === "pending") return "bg-yellow-50 text-yellow-700 border-yellow-200"
        if (paymentStatus === "failed") return "bg-red-50 text-red-700 border-red-200"
        return "bg-gray-50 text-gray-700 border-gray-200"
    }

    return (
        <Badge variant="outline" className={getStatusColor()}>
            {paymentStatus || status}
        </Badge>
    )
}

// Client component for interactive buttons
function TransactionActions({ transaction }: { transaction: Transaction }) {
    const [isDownloading, setIsDownloading] = useState(false)

    const downloadTransactionPDF = async (transactionId: string) => {
        try {
            setIsDownloading(true)
            console.log("Downloading PDF for transaction:", transactionId)

            const response = await fetch('/api/paddle/transaction_pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId })
            });

            console.log("Response status:", response.status)
            console.log("Response headers:", response.headers)

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`
                try {
                    const errorData = await response.json()
                    console.error("Error response:", errorData)
                    errorMessage = errorData.error || errorMessage
                } catch (parseError) {
                    try {
                        const errorText = await response.text()
                        console.error("Error text:", errorText)
                        errorMessage = errorText || errorMessage
                    } catch (textError) {
                        console.error("Could not parse error response:", textError)
                    }
                }
                throw new Error(errorMessage)
            }

            const contentType = response.headers.get('content-type')
            console.log("Content type:", contentType)

            if (!contentType?.includes('application/pdf')) {
                console.warn("Response is not a PDF. Content-Type:", contentType)
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json()
                    console.error("JSON error response:", errorData)
                    throw new Error(errorData.error || "Invalid response format")
                }
            }

            const blob = await response.blob()
            console.log("Blob size:", blob.size, "bytes")

            if (blob.size === 0) {
                throw new Error("Received empty PDF file")
            }

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `transaction-${transactionId}.pdf`
            document.body.appendChild(link)
            link.click()

            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)

            console.log("PDF download initiated successfully")
        } catch (error) {
            console.error("Error downloading transaction PDF:", error)
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
            alert(`Failed to download transaction PDF: ${errorMessage}`)
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="text-right space-x-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadTransactionPDF(transaction.paddle_transaction_id)}
                disabled={isDownloading}
            >
                <Download className="h-3 w-3 mr-1" />
                {isDownloading ? "Loading..." : "PDF"}
            </Button>
        </div>
    )
}

// Function to format dates in the client component
function formatDateClient(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

// Component for transaction table
function TransactionTable({ transactions }: { transactions: Transaction[] }) {

    const formatAmount = (amount: number, currency: string): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100)
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No transactions found.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <div className="grid grid-cols-6 border-b bg-gray-50 p-4 text-sm font-medium text-gray-500">
                <div>Transaction</div>
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Period</div>
                <div className="text-right">Actions</div>
            </div>
            {transactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-6 p-4 text-sm border-b last:border-b-0">
                    <div className="font-medium">{transaction.invoice_number || transaction.paddle_transaction_id.slice(-8)}</div>
                    <div>{formatDateClient(transaction.billed_at)}</div>
                    <div className="font-medium">{formatAmount(transaction.grand_total, transaction.currency)}</div>
                    <div>
                        <TransactionStatusBadge status={transaction.status} paymentStatus={transaction.payment_status} />
                    </div>
                    <div className="text-xs text-gray-500">
                        {transaction.billing_period_start && transaction.billing_period_end ? (
                            <div>
                                <div>{formatDateClient(transaction.billing_period_start)}</div>
                                <div>to {formatDateClient(transaction.billing_period_end)}</div>
                            </div>
                        ) : (
                            "One-time"
                        )}
                    </div>
                    <TransactionActions transaction={transaction} />
                </div>
            ))}
        </div>
    )
}

// Component for canceled subscription status
function CanceledSubscriptionStatus({
    subscription,
    formattedDates,
    subDetails
}: {
    subscription: Subscription
    formattedDates: { canceledAt: string }
    subDetails: SubscriptionDetails | null
}) {

    return (
        <div>
            {/* Canceled Status Alert */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Subscription Canceled</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>Your subscription was canceled on {formattedDates.canceledAt}.</p>
                            <p className="mt-1">You can subscribe to a new plan to regain access to premium features.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center mb-6">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mr-2">
                    Canceled
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Previous Plan</p>
                        <p className="text-gray-900 text-lg font-medium">{subDetails?.planName || "Premium Plan"}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Was Billing</p>
                        <p className="text-gray-900">
                            {subDetails?.amount || `$${subscription.price}`} {subDetails?.currency || subscription.currency_code} / {subDetails?.interval || "month"}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Canceled Date</p>
                        <p className="text-gray-900">{formattedDates.canceledAt}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Subscription ID</p>
                        <p className="text-gray-900 text-xs font-mono">{subscription.paddle_subscription_id}</p>
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
    )
}

export default function DashboardClient({
    user,
    subscription,
    isSubscribed,
    isTrialing,
    isCanceled,
    daysRemaining,
    subDetails,
    subscriptionTransactions,
    allTransactions,
    formattedDates,
}: DashboardProps) {
    // Check if we have a canceled subscription (subscription exists but is canceled)
    const hasCanceledSubscription = subscription && (isCanceled || subscription.status === 'canceled')

    // Safely get the transaction_id with proper error handling
    const getTransactionId = () => {
        if (!subscription?.paddle_subscription_id || !allTransactions.length) {
            return null
        }

        const matchingTransaction = allTransactions.find(
            transaction => transaction.subscription_id === subscription.paddle_subscription_id
        )

        return matchingTransaction?.paddle_transaction_id || null
    }

    const transaction_id = getTransactionId()
    console.log({ transaction_id })

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-gray-900 flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        <span>YourStartup</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/pricing">
                            <Button variant="ghost" size="sm">
                                Pricing
                            </Button>
                        </Link>
                        <form action={signout} className="inline">
                            <Button type="submit" variant="ghost" size="sm" className="flex items-center">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="max-w-6xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <Link href="/" className="hover:text-gray-700">
                            Home
                        </Link>
                        <ChevronRight className="h-4 w-4 mx-2" />
                        <span className="text-gray-700">My Subscription</span>
                    </div>

                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Subscription</h1>
                            <p className="text-gray-500">Manage your subscription and billing information</p>
                        </div>
                        <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <Link href="/account">
                                <Button variant="outline" size="sm" className="flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Account
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Subscription Status Card */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Subscription Status</CardTitle>
                                    <CreditCard className="h-5 w-5 text-gray-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {hasCanceledSubscription ? (
                                    <CanceledSubscriptionStatus
                                        subscription={subscription}
                                        formattedDates={formattedDates}
                                        subDetails={subDetails}
                                    />
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
                                                    <p className="text-sm font-medium text-gray-500">Plan</p>
                                                    <p className="text-gray-900 text-lg font-medium">{subDetails?.planName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Billing</p>
                                                    <p className="text-gray-900">
                                                        {subDetails?.amount} {subDetails?.currency} / {subDetails?.interval}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <p className="text-sm font-medium text-gray-500">Current Period</p>
                                                        <p className="text-sm text-gray-500">{daysRemaining} days left</p>
                                                    </div>
                                                    <Progress value={Math.max(0, Math.min(100, (daysRemaining / 30) * 100))} className="h-2" />
                                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                        <p>Started: {formattedDates.currentPeriodStart}</p>
                                                        <p>Next billing: {formattedDates.currentPeriodEnd}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Payment Method</p>
                                                    <p className="text-gray-900">•••• •••• •••• 4242</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {subscription?.paddle_subscription_id && transaction_id && (
                                                <CancelSubscriptionButton
                                                    subscriptionId={subscription.paddle_subscription_id}
                                                    subscription={subscription}
                                                    transactionId={transaction_id}
                                                />
                                            )}
                                            <Link href="/billing/update-payment">
                                                <Button variant="outline">Update Payment Method</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <Shield className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-amber-800">No active subscription</h3>
                                                    <div className="mt-2 text-sm text-amber-700">
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

                        {/* Account Info Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Account Info</CardTitle>
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-gray-900">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                                    <p className="text-gray-900">{user.formattedCreatedAt}</p>
                                </div>
                                {subscription && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Subscription ID</p>
                                        <p className="text-gray-900 text-xs font-mono">{subscription.paddle_subscription_id}</p>
                                    </div>
                                )}
                                <Link href="/account/profile">
                                    <Button variant="outline" size="sm" className="w-full mt-2">
                                        Edit Profile
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transactions Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing & Transactions</CardTitle>
                            <CardDescription>View your payment history and download transaction PDFs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="current" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="current">
                                        {hasCanceledSubscription ? "Previous Subscription" : "Current Subscription"}
                                    </TabsTrigger>
                                    <TabsTrigger value="all">All Transactions</TabsTrigger>
                                </TabsList>
                                <TabsContent value="current" className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">
                                            Transactions for your {hasCanceledSubscription ? "previous" : "current"} subscription
                                        </p>
                                        <Badge variant="secondary">{subscriptionTransactions.length} transactions</Badge>
                                    </div>
                                    <TransactionTable transactions={subscriptionTransactions} />
                                </TabsContent>
                                <TabsContent value="all" className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-600">All transactions across all subscriptions</p>
                                        <Badge variant="secondary">{allTransactions.length} transactions</Badge>
                                    </div>
                                    <TransactionTable transactions={allTransactions} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Subscription Features - Only show for active subscriptions */}
                    {isSubscribed && !hasCanceledSubscription && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Your Plan Features</CardTitle>
                                <CardDescription>Features included in your current subscription</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 1: Advanced analytics and reporting</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 2: Unlimited projects and collaborators</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 3: Priority customer support</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 4: Custom integrations</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 5: Advanced security features</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span>Feature 6: API access</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center text-gray-500 text-sm">
                        <p>© {new Date().getFullYear()} YourStartup, Inc. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}