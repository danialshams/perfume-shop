import type { ReactNode } from "react";
import { cn } from "./cart.utils";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative min-h-[70svh] overflow-x-clip bg-[#f5f2ed] text-[#302d29]", className)}>{children}</div>;
}

export function ContentContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("relative mx-auto w-full max-w-[900px] px-5 pt-10 pb-16 sm:px-8 lg:pt-20 lg:pb-28", className)}>{children}</section>;
}
