import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Redirect to dashboard if already logged in
    if (user) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="border-b border-gray-200 bg-white py-4">
                <div className="container mx-auto px-4">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        YourStartup
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200">
                    {children}
                </div>
            </main>

            <footer className="py-6 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} YourStartup, Inc. All rights reserved.</p>
            </footer>
        </div>
    )
}
