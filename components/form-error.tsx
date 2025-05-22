
import { cn } from "@/lib/utils";

interface FormErrorProps {
    message?: string;
    className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
    if (!message) return null;

    return (
        <div className={cn(
            "bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-x-2",
            className
        )}>
            <p>{message}</p>
        </div>
    );
}
