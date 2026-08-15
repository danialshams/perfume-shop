import { Loader2 } from "lucide-react";
import { cn } from "./cart.utils";

export default function MiniSpinner({ className }: { className?: string }) {
    return (
        <Loader2
            size={15}
            className={cn("animate-spin text-[#6F8FB6]", className)}
            strokeWidth={2.2}
        />
    );
}
