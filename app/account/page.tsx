import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { signout } from "@/lib/actions"

export default async function AccountPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Format dates for better readability
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="container px-4 md:px-6 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Account Settings</h1>
                    <p className="text-muted-foreground">View your account information</p>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
                                <p className="font-medium mt-1">{user.email}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">User ID</h3>
                                <p className="font-mono text-sm mt-1">{user.id}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Account Created</h3>
                                <p className="mt-1">{formatDate(user.created_at)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Sign In</h3>
                                <p className="mt-1">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Manage your account security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Password</h3>
                            <p className="mt-1">••••••••••••</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/account/change-password">Change Password</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Actions</CardTitle>
                        <CardDescription>Manage your account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <form action={signout}>
                                <Button type="submit" variant="outline">
                                    Sign Out
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
