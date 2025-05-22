
import { cn } from "@/lib/utils";

interface FormSuccessProps {
    message?: string;
    className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
    if (!message) return null;

    return (
        <div className={cn(
            "bg-emerald-500/15 text-emerald-500 text-sm p-3 rounded-md flex items-center gap-x-2",
            className
        )}>
            <p>{message}</p>
        </div>
    );
}