import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site-config"
import { createClient } from "@/lib/supabase/server"
import { signout } from "@/lib/actions"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, CreditCard } from 'lucide-react'

export async function SiteHeader() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-bold text-xl">{siteConfig.name}</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6 ml-6">
                        <Link
                            href="/pricing"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Pricing
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="relative">
                                        <User className="h-4 w-4 mr-2" />
                                        <span className="hidden md:inline-block">Account</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/account">
                                            <User className="h-4 w-4 mr-2" />
                                            Account
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <form action={signout} className="w-full">
                                            <button type="submit" className="flex items-center w-full">
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Sign Out
                                            </button>
                                        </form>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/auth/login">
                                <Button variant="ghost" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
