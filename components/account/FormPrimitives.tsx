import { ReactNode } from "react";
import { T } from "./utils";
import { FieldError } from "./FieldError";

/** سکشن: خط مو در بالا، سپس شمارهٔ ریز و عنوان */
export function Section({
    index,
    title,
    spaced = true,
    children,
}: {
    index: string;
    title: string;
    spaced?: boolean;
    children: ReactNode;
}) {
    return (
        <section className={spaced ? "mt-16 sm:mt-20" : ""}>
            <div className="mb-10">
                <span
                    aria-hidden="true"
                    className="block h-px w-full"
                    style={{ background: T.hairline }}
                />
                <div className="mt-4 flex items-baseline gap-3">
                    <span
                        className="select-none text-[10px] font-normal tabular-nums tracking-[0.24em]"
                        style={{ color: T.ink3 }}
                    >
                        {index}
                    </span>
                    <h2
                        className="select-none text-[12.5px] font-medium tracking-[0.18em]"
                        style={{ color: T.ink1 }}
                    >
                        {title}
                    </h2>
                </div>
            </div>

            <div className="space-y-9">{children}</div>
        </section>
    );
}

/** ردیف افقی: برچسب سمت راست، مقدار جلوی آن روی همان خط */
export function Row({
    htmlFor,
    label,
    required = false,
    children,
}: {
    htmlFor?: string;
    label: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start gap-4 sm:gap-7">
            <label
                htmlFor={htmlFor}
                className="w-[5.5rem] shrink-0 select-none pt-[6px] text-[11.5px] font-medium leading-[1.5] tracking-[0.03em] sm:w-[8.5rem] sm:text-[12px]"
                style={{ color: T.ink2 }}
            >
                <span className="inline-flex items-baseline gap-1">
                    {label}
                    {required && (
                        <span
                            aria-hidden="true"
                            className="text-[13px] leading-none"
                            style={{ color: T.danger }}
                        >
                            *
                        </span>
                    )}
                </span>
                {!required && (
                    <span
                        className="mt-1 block text-[9.5px] font-normal tracking-normal"
                        style={{ color: T.ink3 }}
                    >
                        اختیاری
                    </span>
                )}
            </label>

            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

/**
 * Field: پوستهٔ هر ورودی.
 * خطا و شمارنده همیشه مستقیماً زیر همان ورودی رندر می‌شوند.
 */
export function Field({
    width = "w-full",
    valid = false,
    error,
    errorId,
    trailing,
    meta,
    children,
}: {
    width?: string;
    valid?: boolean;
    error?: string;
    errorId: string;
    trailing?: ReactNode;
    meta?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className={width}>
            <div className="relative">
                {children}

                {trailing}

                <span
                    aria-hidden="true"
                    className={[
                        "pointer-events-none absolute left-0 top-[8px] transition-opacity duration-500 ease-out",
                        valid ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M1.5 6.4L4.3 9.2L10.5 2.8"
                            stroke={T.ok}
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>

            {(error || meta) && (
                <div className="flex items-start justify-between gap-3">
                    <FieldError id={errorId} message={error} />
                    {meta && <div className="mr-auto shrink-0">{meta}</div>}
                </div>
            )}
        </div>
    );
}

/** کلاس پایهٔ فیلدها */
export function fieldClass(opts: {
    hasError?: boolean;
    valid?: boolean;
    withToggle?: boolean;
    disabled?: boolean;
}) {
    const { hasError, valid, withToggle, disabled } = opts;

    return [
        "w-full appearance-none rounded-none border-0 border-b bg-transparent",
        "pb-2 pt-0 text-[14px] font-light leading-[1.85]",
        "outline-none transition-all duration-300 ease-out",
        "placeholder:text-[12px] placeholder:font-light placeholder:tracking-wide",
        valid ? "pl-[18px]" : "pl-0",
        withToggle ? "pr-[3.4rem]" : "pr-0",
        disabled ? "cursor-not-allowed text-[#A8A49E]" : "",
        hasError ? "border-b-[#B42318]" : "border-b-[#EAE7E2] focus:border-b-[#1A1A1A]",
    ].join(" ");
}

/** دکمهٔ نمایش/پنهان — دقیقاً روی خط انتهایی فیلد */
export function ToggleReveal({
    shown,
    onToggle,
    label,
}: {
    shown: boolean;
    onToggle: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute bottom-2 right-0 z-10 select-none text-[10.5px] font-normal leading-none tracking-[0.08em] transition-colors duration-300 hover:text-[#1A1A1A]"
            style={{ color: T.ink3 }}
            aria-pressed={shown}
            aria-label={label}
        >
            {shown ? "پنهان" : "نمایش"}
        </button>
    );
}

/** دکمهٔ اصلی — بلوک تیره با فیل هاور */
export function PrimaryButton({
    children,
    disabled,
    type = "submit",
    onClick,
}: {
    children: ReactNode;
    disabled?: boolean;
    type?: "submit" | "button";
    onClick?: () => void;
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className="group relative w-full overflow-hidden px-8 py-[18px] text-[12px] font-medium tracking-[0.18em] transition-opacity duration-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[16rem]"
            style={{ background: T.ink1, color: T.paper }}
        >
            <span className="relative z-10">{children}</span>
            <span
                aria-hidden="true"
                className="absolute inset-0 origin-right scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 group-disabled:hidden"
                style={{ background: "#332F2B" }}
            />
        </button>
    );
}

/** دکمهٔ ثانویه — قاب خط مو */
export function GhostButton({
    children,
    onClick,
    disabled,
}: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="w-full border px-8 py-[17px] text-[12px] font-medium tracking-[0.18em] transition-colors duration-300 hover:bg-[#F6F5F3] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[16rem]"
            style={{ borderColor: T.hairline, color: T.ink2 }}
        >
            {children}
        </button>
    );
}
