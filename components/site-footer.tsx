import Link from "next/link"
import { siteConfig } from "@/config/site-config"

export function SiteFooter() {
    return (
        <footer className="border-t bg-background">
            <div className="container py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link href="/" className="font-bold text-xl">
                            {siteConfig.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{siteConfig.description}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
