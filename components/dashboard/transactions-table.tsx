"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface Transaction {
    id: string
    paddle_transaction_id: string
    invoice_number?: string
    billed_at: string
    grand_total: number
    currency: string
    status: string
    payment_status: string
    billing_period_start?: string
    billing_period_end?: string
    subscription_id?: string
}

interface TransactionTableProps {
    transactions: Transaction[]
}

// Component for rendering transaction status badge
function TransactionStatusBadge({ status, paymentStatus }: { status: string; paymentStatus: string }) {
    const getStatusColor = () => {
        if (paymentStatus === "paid")
            return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/30"
        if (paymentStatus === "pending")
            return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/30"
        if (paymentStatus === "failed")
            return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30"
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700/30"
    }

    return (
        <Badge variant="outline" className={getStatusColor()}>
            {paymentStatus || status}
        </Badge>
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

export function TransactionTable({ transactions }: TransactionTableProps) {
    const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({})

    const formatAmount = (amount: number, currency: string): string => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100)
    }

    const downloadTransactionPDF = async (transactionId: string) => {
        try {
            setIsDownloading((prev) => ({ ...prev, [transactionId]: true }))
            console.log("Downloading PDF for transaction:", transactionId)

            const response = await fetch("/api/paddle/transaction_pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId }),
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `transaction-${transactionId}.pdf`
            document.body.appendChild(link)
            link.click()

            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)
        } catch (error) {
            console.error("Error downloading transaction PDF:", error)
            alert(`Failed to download transaction PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsDownloading((prev) => ({ ...prev, [transactionId]: false }))
        }
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <div className="grid grid-cols-6 border-b bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
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
                    <div className="text-xs text-muted-foreground">
                        {transaction.billing_period_start && transaction.billing_period_end ? (
                            <div>
                                <div>{formatDateClient(transaction.billing_period_start)}</div>
                                <div>to {formatDateClient(transaction.billing_period_end)}</div>
                            </div>
                        ) : (
                            "One-time"
                        )}
                    </div>
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadTransactionPDF(transaction.paddle_transaction_id)}
                            disabled={isDownloading[transaction.paddle_transaction_id]}
                        >
                            <Download className="h-3 w-3 mr-1" />
                            {isDownloading[transaction.paddle_transaction_id] ? "Loading..." : "PDF"}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
