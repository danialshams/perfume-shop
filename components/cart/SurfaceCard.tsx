import type { ReactNode } from "react";
import { ui } from "./cart.tokens";
import { cn } from "./cart.utils";

export default function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border border-[#ded6cb] bg-[#fbfaf7]", ui.radius.card, className)}>{children}</div>;
}
