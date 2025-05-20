import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { txn?: string }
}) {
  const transactionId = searchParams.txn || "Unknown"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>Thank you for your purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
              <p className="font-mono text-sm break-all">{transactionId}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">What happens next?</h3>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li>• You'll receive a confirmation email with your receipt</li>
                <li>• Your subscription is now active</li>
                <li>• You can access all premium features immediately</li>
                <li>• Your first billing cycle starts today</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/">Return to Dashboard</Link>
            </Button>
            <div className="text-center text-sm text-gray-500">
              <p>
                Need help?{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Contact our support team
                </a>
              </p>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
