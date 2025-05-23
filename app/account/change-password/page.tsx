import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChangePasswordForm } from "@/components/account/change-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function ChangePasswordPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    return (
        <div className="container px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                    <Link href="/account">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Account
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold mb-1">Change Password</h1>
                    <p className="text-muted-foreground">Update your password to keep your account secure</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChangePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
