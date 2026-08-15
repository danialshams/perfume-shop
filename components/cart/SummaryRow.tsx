// SummaryRow.tsx
export default function SummaryRow({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-light tracking-[0.04em] text-[#6B6B6B]">
                {label}
            </span>
            <span 
                className={
                    accent 
                        ? "text-[13px] font-light tracking-[0.02em] text-[#8A8A8A]" 
                        : "text-[13px] font-light tracking-[0.02em] text-[#1A1A1A]"
                }
            >
                {value}
            </span>
        </div>
    );
}
