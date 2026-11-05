import type { ReactNode } from "react";

export default function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-normal tracking-[0.24em] text-[#9b8263]">{children}</p>;
}
