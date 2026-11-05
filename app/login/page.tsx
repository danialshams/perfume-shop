"use client";

import {
    FormEvent,
    ReactNode,
    Suspense,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

const T = {
    paper: "#FFFFFF",
    ink1: "#2C2926",
    ink2: "#6B6863",
    ink3: "#A8A49E",
    hairline: "#EAE7E2",
    smoke: "#F6F5F3",
    danger: "#B42318",
    ok: "#4B7A52",
    /* password strength ramp */
    s1: "#E0B341", // ضعیف — زرد
    s2: "#E08A2E", // متوسط — نارنجی
    s3: "#7A8B4F", // خوب — سبز زیتونی
    s4: "#4FB3E8", // قوی — آبی آسمانی
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RegisterForm = {
    first_name: string;
    last_name: string;
    mobile: string;
    password: string;
    confirm_password: string;
    province: string;
    city: string;
    address: string;
    plaque: string;
    floor: string;
    unit: string;
    postal_code: string;
    phone: string;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
type RegisterTouched = Partial<Record<keyof RegisterForm, boolean>>;

type ApiResponse<T = unknown> = {
    success?: boolean;
    message?: string;
    errors?: Array<{ message?: string; path?: Array<string | number> }>;
    data?: T;
};

const initialRegister: RegisterForm = {
    first_name: "",
    last_name: "",
    mobile: "",
    password: "",
    confirm_password: "",
    province: "",
    city: "",
    address: "",
    plaque: "",
    floor: "",
    unit: "",
    postal_code: "",
    phone: "",
};

const ADDRESS_MAX = 250;
const ADDRESS_COUNTER_FROM = Math.floor(ADDRESS_MAX * 0.8); // 200

const NON_LATIN_PASSWORD_MESSAGE = "رمز عبور باید با حروف و کاراکترهای انگلیسی باشد";

/* ------------------------------------------------------------------ */
/*  Normalizers                                                        */
/* ------------------------------------------------------------------ */

const persianArabicDigitsMap: Record<string, string> = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const mobileRegex = /^09\d{9}$/;
/** تلفن ثابت: فقط شروع با ۰ و مجموعاً ۱۱ رقم — بدون محدودیت کد شهر */
const landlineRegex = /^0\d{10}$/;
const postalCodeRegex = /^\d{10}$/;
const nameRegex = /^[\u0600-\u06FFa-zA-Z\s‌-]+$/;
const simpleTextRegex = /^[\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،]+$/;
/** فقط ASCII قابل چاپ — هیچ حرف فارسی/عربی و هیچ رقم غیرلاتین */
const latinOnlyRegex = /^[\x20-\x7E]+$/;
const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

function toEnglishDigits(value: string) {
    return value.replace(/[۰-۹٠-٩]/g, (d) => persianArabicDigitsMap[d] || d);
}

function onlyDigits(value: string, maxLength: number) {
    return toEnglishDigits(value).replace(/\D/g, "").slice(0, maxLength);
}

function normalizeMobileInput(value: string, previousValue: string) {
    const digits = onlyDigits(value, 11);
    if (!digits) return "";
    if (digits.length === 1) return digits === "0" ? digits : previousValue;
    if (!digits.startsWith("09")) return previousValue;
    return digits;
}

/** فقط الزام شروع با ۰ و سقف ۱۱ رقم */
function normalizeLandlineInput(value: string, previousValue: string) {
    const digits = onlyDigits(value, 11);
    if (!digits) return "";
    if (!digits.startsWith("0")) return previousValue;
    return digits;
}

function sanitizeName(value: string, maxLength = 50) {
    return value
        .replace(/[0-9۰-۹٠-٩]/g, "")
        .replace(/[^\u0600-\u06FFa-zA-Z\s‌-]/g, "")
        .slice(0, maxLength);
}

function sanitizeSimpleText(value: string, maxLength: number) {
    return toEnglishDigits(value)
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،]/g, "")
        .slice(0, maxLength);
}

function sanitizeAddress(value: string) {
    return toEnglishDigits(value)
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،#()]/g, "")
        .slice(0, ADDRESS_MAX);
}

/**
 * رمز عبور: هر کاراکتر خارج از ASCII قابل چاپ حذف می‌شود.
 * blocked مشخص می‌کند چیزی حذف شده تا خطای راهنما نشان داده شود.
 */
function sanitizePassword(value: string): { value: string; blocked: boolean } {
    const cleaned = value.replace(/[^\x20-\x7E]/g, "").slice(0, 100);
    return { value: cleaned, blocked: cleaned.length !== value.slice(0, 100).length };
}

/* ------------------------------------------------------------------ */
/*  Password strength — یک خط یکسره با طیف رنگ                        */
/* ------------------------------------------------------------------ */

type Strength = {
    score: number;
    percent: number;
    label: string;
    color: string;
};

function getPasswordStrength(password: string): Strength {
    if (!password) {
        return { score: 0, percent: 0, label: "", color: T.hairline };
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z\d]/.test(password)) score += 1;
    if (password.length >= 14 && score === 5) score += 1;

    if (score <= 2) return { score, percent: 28, label: "ضعیف", color: T.s1 };
    if (score === 3) return { score, percent: 52, label: "متوسط", color: T.s2 };
    if (score === 4) return { score, percent: 76, label: "خوب", color: T.s3 };
    return { score, percent: 100, label: "قوی", color: T.s4 };
}

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */

async function parseApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        const text = await res.text();
        const trimmed = text.trim();
        const isHtml = trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");

        if (isHtml) {
            throw new Error(
                `پاسخ API از نوع HTML است، نه JSON. مسیر API یا proxy را بررسی کنید. Status: ${res.status}`,
            );
        }

        throw new Error(text || `پاسخ API معتبر نیست. Status: ${res.status}`);
    }

    return res.json();
}

/* ------------------------------------------------------------------ */
/*  Validation — همه الزامی، به‌جز کد پستی و تلفن ثابت                 */
/* ------------------------------------------------------------------ */

function validateRegisterForm(form: RegisterForm): RegisterErrors {
    const errors: RegisterErrors = {};

    if (!form.first_name.trim()) {
        errors.first_name = "نام الزامی است";
    } else if (form.first_name.trim().length < 2) {
        errors.first_name = "نام باید حداقل ۲ حرف باشد";
    } else if (!nameRegex.test(form.first_name.trim())) {
        errors.first_name = "نام فقط می‌تواند شامل حروف باشد";
    }

    if (!form.last_name.trim()) {
        errors.last_name = "نام خانوادگی الزامی است";
    } else if (form.last_name.trim().length < 2) {
        errors.last_name = "نام خانوادگی باید حداقل ۲ حرف باشد";
    } else if (!nameRegex.test(form.last_name.trim())) {
        errors.last_name = "نام خانوادگی فقط می‌تواند شامل حروف باشد";
    }

    if (!form.mobile.trim()) {
        errors.mobile = "شماره موبایل الزامی است";
    } else if (!mobileRegex.test(form.mobile.trim())) {
        errors.mobile = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود";
    }

    if (!form.password) {
        errors.password = "رمز عبور الزامی است";
    } else if (!latinOnlyRegex.test(form.password)) {
        errors.password = NON_LATIN_PASSWORD_MESSAGE;
    } else if (!strongPasswordRegex.test(form.password)) {
        errors.password =
            "حداقل ۸ کاراکتر، شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص";
    }

    if (!form.confirm_password) {
        errors.confirm_password = "تکرار رمز عبور الزامی است";
    } else if (!latinOnlyRegex.test(form.confirm_password)) {
        errors.confirm_password = NON_LATIN_PASSWORD_MESSAGE;
    } else if (form.password !== form.confirm_password) {
        errors.confirm_password = "رمز عبور و تکرار آن یکسان نیستند";
    }

    if (!form.province.trim()) {
        errors.province = "استان الزامی است";
    } else if (form.province.trim().length < 2) {
        errors.province = "استان باید حداقل ۲ حرف باشد";
    } else if (!nameRegex.test(form.province.trim())) {
        errors.province = "استان فقط می‌تواند شامل حروف باشد";
    }

    if (!form.city.trim()) {
        errors.city = "شهر الزامی است";
    } else if (form.city.trim().length < 2) {
        errors.city = "شهر باید حداقل ۲ حرف باشد";
    } else if (!nameRegex.test(form.city.trim())) {
        errors.city = "شهر فقط می‌تواند شامل حروف باشد";
    }

    if (!form.address.trim()) {
        errors.address = "نشانی الزامی است";
    } else if (form.address.trim().length < 10) {
        errors.address = "نشانی باید حداقل ۱۰ کاراکتر باشد";
    } else if (form.address.trim().length > ADDRESS_MAX) {
        errors.address = "نشانی نمی‌تواند بیشتر از ۲۵۰ کاراکتر باشد";
    }

    if (!form.plaque.trim()) {
        errors.plaque = "پلاک الزامی است";
    } else if (!simpleTextRegex.test(form.plaque.trim())) {
        errors.plaque = "پلاک فقط حروف و عدد";
    }

    if (!form.floor.trim()) {
        errors.floor = "طبقه الزامی است";
    } else if (!simpleTextRegex.test(form.floor.trim())) {
        errors.floor = "طبقه فقط حروف و عدد";
    }

    if (!form.unit.trim()) {
        errors.unit = "واحد الزامی است";
    } else if (!simpleTextRegex.test(form.unit.trim())) {
        errors.unit = "واحد فقط حروف و عدد";
    }

    // اختیاری
    if (form.postal_code.trim() && !postalCodeRegex.test(form.postal_code.trim())) {
        errors.postal_code = "کد پستی باید دقیقاً ۱۰ رقم باشد";
    }

    // اختیاری — بدون وابستگی به کد شهر
    if (form.phone.trim() && !landlineRegex.test(form.phone.trim())) {
        errors.phone = "تلفن ثابت باید ۱۱ رقم و با ۰ شروع شود";
    }

    return errors;
}

/* ------------------------------------------------------------------ */
/*  UI primitives                                                      */
/* ------------------------------------------------------------------ */

/** سکشن: خط مو در بالا، سپس شمارهٔ ریز و عنوان */
function Section({
    index,
    title,
    children,
}: {
    index: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="mt-16 first:mt-0 sm:mt-20">
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
function Row({
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

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) return null;

    return (
        <p
            id={id}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-[11px] font-normal leading-[1.6]"
            style={{ color: T.danger }}
        >
            <span
                aria-hidden="true"
                className="mt-[6px] inline-block h-[3px] w-[3px] shrink-0 rounded-full"
                style={{ background: T.danger }}
            />
            {message}
        </p>
    );
}

/**
 * Field: پوستهٔ هر ورودی.
 * خطا و شمارنده همیشه مستقیماً زیر همان ورودی رندر می‌شوند.
 */
function Field({
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
function fieldClass(opts: {
    hasError?: boolean;
    valid?: boolean;
    withToggle?: boolean;
}) {
    const { hasError, valid, withToggle } = opts;

    return [
        "w-full appearance-none rounded-none border-0 border-b bg-transparent",
        "pb-2 pt-0 text-[14px] font-light leading-[1.85]",
        "outline-none transition-all duration-300 ease-out",
        "placeholder:text-[12px] placeholder:font-light placeholder:tracking-wide",
        valid ? "pl-[18px]" : "pl-0",
        withToggle ? "pr-[3.4rem]" : "pr-0",
        hasError ? "border-b-[#B42318]" : "border-b-[#EAE7E2] focus:border-b-[#1A1A1A]",
    ].join(" ");
}

/** دکمهٔ نمایش/پنهان — دقیقاً روی خط انتهایی فیلد */
function ToggleReveal({
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

/* ------------------------------------------------------------------ */
/*  Form (client, uses useSearchParams)                                */
/* ------------------------------------------------------------------ */

function RegisterView() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestRedirect = searchParams.get("redirect");
    const redirect = requestRedirect?.startsWith("/") && !requestRedirect.startsWith("//")
        ? requestRedirect : "/account";
    const [mode, setMode] = useState<"login" | "register">(
        searchParams.get("mode") === "register" ? "register" : "login",
    );
    const [loginMobile, setLoginMobile] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginBusy, setLoginBusy] = useState(false);
    const [loginError, setLoginError] = useState("");

    const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegister);
    const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
    const [touched, setTouched] = useState<RegisterTouched>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const addressRef = useRef<HTMLTextAreaElement | null>(null);

    /** ارتفاع نشانی دقیقاً به اندازهٔ محتوا */
    useEffect(() => {
        const el = addressRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [registerForm.address]);

    /** خالی شدن فیلد رمز، حالت نمایش را هم برمی‌گرداند */
    useEffect(() => {
        if (!registerForm.password) setShowPassword(false);
    }, [registerForm.password]);

    useEffect(() => {
        if (!registerForm.confirm_password) setShowConfirm(false);
    }, [registerForm.confirm_password]);

    function updateRegisterField<K extends keyof RegisterForm>(
        field: K,
        value: RegisterForm[K],
    ) {
        setRegisterForm((prev) => ({ ...prev, [field]: value }));
        setRegisterErrors((prev) => ({ ...prev, [field]: undefined }));
        setError("");
    }

    /** رمز عبور: کاراکتر غیرلاتین حذف و خطای راهنما نمایش داده می‌شود */
    function updatePasswordField(
        field: "password" | "confirm_password",
        rawValue: string,
    ) {
        const { value, blocked } = sanitizePassword(rawValue);

        setRegisterForm((prev) => ({ ...prev, [field]: value }));
        setRegisterErrors((prev) => ({
            ...prev,
            [field]: blocked ? NON_LATIN_PASSWORD_MESSAGE : undefined,
        }));
        setError("");
    }

    /** اعتبارسنجی تدریجی روی blur */
    function handleBlur(field: keyof RegisterForm) {
        setTouched((prev) => ({ ...prev, [field]: true }));

        const all = validateRegisterForm(registerForm);

        setRegisterErrors((prev) => {
            const next: RegisterErrors = { ...prev, [field]: all[field] };

            if (field === "password" && touched.confirm_password) {
                next.confirm_password = all.confirm_password;
            }
            if (field === "confirm_password" && touched.password) {
                next.password = all.password;
            }

            return next;
        });
    }

    function isValid(field: keyof RegisterForm) {
        return Boolean(
            touched[field] && registerForm[field].trim() && !registerErrors[field],
        );
    }

    async function handleRegister(e: FormEvent) {
        e.preventDefault();
        setError("");

        const errors = validateRegisterForm(registerForm);
        setRegisterErrors(errors);
        setTouched(
            Object.keys(initialRegister).reduce<RegisterTouched>((acc, key) => {
                acc[key as keyof RegisterForm] = true;
                return acc;
            }, {}),
        );

        if (Object.keys(errors).length > 0) {
            setError("لطفاً موارد مشخص‌شده را اصلاح کنید.");
            return;
        }

        setLoading(true);

        try {
            const payload: RegisterForm = {
                first_name: registerForm.first_name.trim(),
                last_name: registerForm.last_name.trim(),
                mobile: registerForm.mobile.trim(),
                password: registerForm.password,
                confirm_password: registerForm.confirm_password,
                province: registerForm.province.trim(),
                city: registerForm.city.trim(),
                address: registerForm.address.trim(),
                plaque: registerForm.plaque.trim(),
                floor: registerForm.floor.trim(),
                unit: registerForm.unit.trim(),
                postal_code: registerForm.postal_code.trim(),
                phone: registerForm.phone.trim(),
            };

            const res = await fetch("/api/v1/customers/auth/register", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await parseApiResponse(res);

            if (!res.ok || data?.success === false) {
                const validationMessage =
                    data?.errors?.[0]?.message || data?.message || "ثبت‌نام ناموفق بود";

                throw new Error(validationMessage);
            }

            router.push(redirect);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "خطا در ثبت‌نام");
        } finally {
            setLoading(false);
        }
    }


    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loginBusy) return;
        setLoginError("");
        if (!mobileRegex.test(loginMobile) || loginPassword.length < 6) {
            setLoginError("شماره همراه یا رمز عبور معتبر نیست.");
            return;
        }
        setLoginBusy(true);
        try {
            const response = await fetch("/api/v1/customers/auth/login", {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ mobile: loginMobile, password: loginPassword }),
            });
            const result = await response.json();
            if (!response.ok || result?.success === false) {
                throw new Error(response.status === 401
                    ? "شماره همراه یا رمز عبور اشتباه است."
                    : "ورود انجام نشد. دوباره تلاش کنید.");
            }
            router.replace(redirect);
            router.refresh();
        } catch (error) {
            setLoginError(error instanceof Error ? error.message : "خطا در ورود به حساب");
        } finally {
            setLoginBusy(false);
        }
    }

    if (mode === "login") {
        return (
            <>
                <LuxuryNavbar />
                <main className="maison-auth maison-login" id="main-content">
                    <div className="maison-login__layout">
                        <figure className="maison-login__image">
                            <Image fill priority sizes="(min-width: 900px) 48vw, 100vw"
                                src="/maison/portrait.jpg" alt="شیشه عطر در ترکیب‌بندی هنری"
                                className="object-cover"/>
                            <figcaption dir="ltr" lang="en">A PERSONAL SIGNATURE — FERTINI</figcaption>
                        </figure>
                        <section className="maison-login__content" aria-labelledby="maison-login-heading">
                            <span className="maison-kicker" dir="ltr" lang="en">MEMBERS / FERTINI</span>
                            <h1 id="maison-login-heading">بازگشت به<br/><em>گالری شخصی.</em></h1>
                            <p>برای مشاهدهٔ انتخاب‌ها، اطلاعات حساب و سفارش‌های خود وارد شوید.</p>
                            <form onSubmit={handleLogin} className="maison-login__form" noValidate>
                                <label htmlFor="maison-login-phone">شمارهٔ همراه</label>
                                <input id="maison-login-phone" name="mobile" type="tel"
                                    inputMode="numeric" autoComplete="tel" dir="ltr"
                                    placeholder="09xxxxxxxxx" maxLength={11} required
                                    value={loginMobile}
                                    onChange={event => { setLoginMobile(normalizeMobileInput(event.target.value, loginMobile)); setLoginError(""); }}
                                    aria-invalid={Boolean(loginError)} />
                                <label htmlFor="maison-login-password">رمز عبور</label>
                                <div className="maison-login__password">
                                    <input id="maison-login-password" name="password"
                                        type={showLoginPassword ? "text" : "password"} dir="ltr"
                                        autoComplete="current-password" minLength={6} maxLength={100}
                                        value={loginPassword} onChange={event=>{setLoginPassword(event.target.value);setLoginError("");}}
                                        required aria-invalid={Boolean(loginError)}/>
                                    <button type="button" onClick={() => setShowLoginPassword(value=>!value)}
                                        aria-label={showLoginPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}>
                                        {showLoginPassword ? <EyeOff size={18} strokeWidth={1.4}/> : <Eye size={18} strokeWidth={1.4}/>}
                                    </button>
                                </div>
                                {loginError && <p role="alert" className="maison-login__error">{loginError}</p>}
                                <button type="submit" disabled={loginBusy} className="maison-login__submit">
                                    {loginBusy ? "در حال ورود…" : "ورود به حساب"} <ArrowLeft size={17} strokeWidth={1.2} aria-hidden="true" />
                                </button>
                            </form>
                            <div className="maison-login__switch">
                                <span>هنوز حساب ندارید؟</span>
                                <button type="button" onClick={() => {setMode("register");setLoginError("");}}>ایجاد حساب جدید +</button>
                            </div>
                        </section>
                    </div>
                </main>
                <CinematicFooter />
            </>
        );
    }

    const strength = getPasswordStrength(registerForm.password);
    const addressLength = registerForm.address.length;
    const hasPassword = registerForm.password.length > 0;
    const hasConfirm = registerForm.confirm_password.length > 0;

    return (
        <>
            <LuxuryNavbar />
            <main
                dir="rtl"
                className="maison-auth min-h-screen selection:bg-[#1A1A1A] selection:text-white"
                style={{ background: T.paper, color: T.ink1 }}
            >
                {/* حذف آیکن‌های بومی مرورگر روی فیلد رمز */}
                <style>{`
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none !important;
                }
                input::-webkit-credentials-auto-fill-button,
                input::-webkit-strong-password-auto-fill-button,
                input::-webkit-strong-password-generation-button,
                input::-webkit-caps-lock-indicator {
                    display: none !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    margin: 0 !important;
                }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                textarea:-webkit-autofill {
                    -webkit-text-fill-color: ${T.ink1};
                    -webkit-box-shadow: 0 0 0 1000px ${T.paper} inset;
                    transition: background-color 9999s ease-out 0s;
                }
            `}</style>

                <div className="mx-auto w-full max-w-[42rem] px-6 pb-28 pt-16 sm:px-10 sm:pt-24">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <header className="mb-12 sm:mb-16">
                        <h1
                            className="text-[28px] font-light leading-[1.25] tracking-tight sm:text-[34px]"
                            style={{ color: T.ink1 }}
                        >
                            ایجاد حساب
                        </h1>
                        <button type="button" onClick={() => setMode("login")} className="maison-register__back">
                            قبلاً ثبت‌نام کرده‌اید؟ ورود به حساب ←
                        </button>
                    </header>

                    {/* ── Global error ───────────────────────────────────── */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-10 flex items-start gap-3 border-r-2 py-4 pr-5"
                            style={{ borderColor: T.danger, background: T.smoke }}
                        >
                            <span
                                className="mt-[7px] inline-block h-[4px] w-[4px] shrink-0 rounded-full"
                                style={{ background: T.danger }}
                            />
                            <p
                                className="text-[12.5px] font-normal leading-[1.9]"
                                style={{ color: T.ink1 }}
                            >
                                {error}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} noValidate>

                        {/* ═══ ۰۱ — هویت ═════════════════════════════════ */}
                        <Section index="۰۱" title="هویت">

                            <Row htmlFor="first_name" label="نام و نام خانوادگی" required>
                                <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
                                    <Field
                                        width="w-full max-w-[13rem] sm:w-[13rem]"
                                        valid={isValid("first_name")}
                                        error={registerErrors.first_name}
                                        errorId="err-first_name"
                                    >
                                        <input
                                            id="first_name"
                                            value={registerForm.first_name}
                                            onChange={(e) =>
                                                updateRegisterField("first_name", sanitizeName(e.target.value))
                                            }
                                            onBlur={() => handleBlur("first_name")}
                                            className={fieldClass({
                                                hasError: Boolean(registerErrors.first_name),
                                                valid: isValid("first_name"),
                                            })}
                                            placeholder="نام"
                                            maxLength={50}
                                            autoComplete="given-name"
                                            aria-label="نام"
                                            aria-invalid={Boolean(registerErrors.first_name)}
                                            aria-describedby={
                                                registerErrors.first_name ? "err-first_name" : undefined
                                            }
                                        />
                                    </Field>

                                    <Field
                                        width="w-full max-w-[13rem] sm:w-[13rem]"
                                        valid={isValid("last_name")}
                                        error={registerErrors.last_name}
                                        errorId="err-last_name"
                                    >
                                        <input
                                            id="last_name"
                                            value={registerForm.last_name}
                                            onChange={(e) =>
                                                updateRegisterField("last_name", sanitizeName(e.target.value))
                                            }
                                            onBlur={() => handleBlur("last_name")}
                                            className={fieldClass({
                                                hasError: Boolean(registerErrors.last_name),
                                                valid: isValid("last_name"),
                                            })}
                                            placeholder="نام خانوادگی"
                                            maxLength={50}
                                            autoComplete="family-name"
                                            aria-label="نام خانوادگی"
                                            aria-invalid={Boolean(registerErrors.last_name)}
                                            aria-describedby={
                                                registerErrors.last_name ? "err-last_name" : undefined
                                            }
                                        />
                                    </Field>
                                </div>
                            </Row>

                            <Row htmlFor="mobile" label="شماره موبایل" required>
                                <Field
                                    width="w-full max-w-[13rem]"
                                    valid={isValid("mobile")}
                                    error={registerErrors.mobile}
                                    errorId="err-mobile"
                                >
                                    <input
                                        id="mobile"
                                        value={registerForm.mobile}
                                        onChange={(e) =>
                                            updateRegisterField(
                                                "mobile",
                                                normalizeMobileInput(e.target.value, registerForm.mobile),
                                            )
                                        }
                                        onBlur={() => handleBlur("mobile")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.mobile),
                                            valid: isValid("mobile"),
                                        })} tracking-[0.14em] tabular-nums`}
                                        placeholder="09120000000"
                                        inputMode="numeric"
                                        maxLength={11}
                                        autoComplete="tel"
                                        dir="ltr"
                                        aria-invalid={Boolean(registerErrors.mobile)}
                                        aria-describedby={registerErrors.mobile ? "err-mobile" : undefined}
                                    />
                                </Field>
                            </Row>
                        </Section>

                        {/* ═══ ۰۲ — نشانی ════════════════════════════════ */}
                        <Section index="۰۲" title="نشانی">

                            <Row htmlFor="province" label="استان و شهر" required>
                                <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
                                    <Field
                                        width="w-full max-w-[11rem] sm:w-[11rem]"
                                        valid={isValid("province")}
                                        error={registerErrors.province}
                                        errorId="err-province"
                                    >
                                        <input
                                            id="province"
                                            value={registerForm.province}
                                            onChange={(e) =>
                                                updateRegisterField("province", sanitizeName(e.target.value))
                                            }
                                            onBlur={() => handleBlur("province")}
                                            className={fieldClass({
                                                hasError: Boolean(registerErrors.province),
                                                valid: isValid("province"),
                                            })}
                                            placeholder="استان"
                                            maxLength={50}
                                            autoComplete="address-level1"
                                            aria-label="استان"
                                            aria-invalid={Boolean(registerErrors.province)}
                                            aria-describedby={
                                                registerErrors.province ? "err-province" : undefined
                                            }
                                        />
                                    </Field>

                                    <Field
                                        width="w-full max-w-[11rem] sm:w-[11rem]"
                                        valid={isValid("city")}
                                        error={registerErrors.city}
                                        errorId="err-city"
                                    >
                                        <input
                                            id="city"
                                            value={registerForm.city}
                                            onChange={(e) =>
                                                updateRegisterField("city", sanitizeName(e.target.value))
                                            }
                                            onBlur={() => handleBlur("city")}
                                            className={fieldClass({
                                                hasError: Boolean(registerErrors.city),
                                                valid: isValid("city"),
                                            })}
                                            placeholder="شهر"
                                            maxLength={50}
                                            autoComplete="address-level2"
                                            aria-label="شهر"
                                            aria-invalid={Boolean(registerErrors.city)}
                                            aria-describedby={registerErrors.city ? "err-city" : undefined}
                                        />
                                    </Field>
                                </div>
                            </Row>

                            <Row htmlFor="address" label="نشانی کامل" required>
                                <Field
                                    width="w-full"
                                    error={registerErrors.address}
                                    errorId="err-address"
                                    meta={
                                        addressLength >= ADDRESS_COUNTER_FROM ? (
                                            <span
                                                className="mt-2 block text-[10.5px] font-normal tabular-nums"
                                                style={{
                                                    color: addressLength >= ADDRESS_MAX ? T.danger : T.ink3,
                                                }}
                                            >
                                                {addressLength} / {ADDRESS_MAX}
                                            </span>
                                        ) : undefined
                                    }
                                >
                                    <textarea
                                        ref={addressRef}
                                        id="address"
                                        value={registerForm.address}
                                        onChange={(e) =>
                                            updateRegisterField("address", sanitizeAddress(e.target.value))
                                        }
                                        onBlur={() => handleBlur("address")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.address),
                                        })} resize-none overflow-hidden`}
                                        rows={1}
                                        maxLength={ADDRESS_MAX}
                                        placeholder="خیابان، کوچه، نشانه‌های کمکی"
                                        autoComplete="street-address"
                                        aria-invalid={Boolean(registerErrors.address)}
                                        aria-describedby={registerErrors.address ? "err-address" : undefined}
                                    />
                                </Field>
                            </Row>

                            <Row htmlFor="plaque" label="پلاک / طبقه / واحد" required>
                                <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
                                    <Field
                                        width="w-[6.5rem]"
                                        valid={isValid("plaque")}
                                        error={registerErrors.plaque}
                                        errorId="err-plaque"
                                    >
                                        <input
                                            id="plaque"
                                            value={registerForm.plaque}
                                            onChange={(e) =>
                                                updateRegisterField(
                                                    "plaque",
                                                    sanitizeSimpleText(e.target.value, 20),
                                                )
                                            }
                                            onBlur={() => handleBlur("plaque")}
                                            className={`${fieldClass({
                                                hasError: Boolean(registerErrors.plaque),
                                                valid: isValid("plaque"),
                                            })} text-center`}
                                            placeholder="پلاک"
                                            maxLength={20}
                                            aria-label="پلاک"
                                            aria-invalid={Boolean(registerErrors.plaque)}
                                            aria-describedby={registerErrors.plaque ? "err-plaque" : undefined}
                                        />
                                    </Field>

                                    <Field
                                        width="w-[6.5rem]"
                                        valid={isValid("floor")}
                                        error={registerErrors.floor}
                                        errorId="err-floor"
                                    >
                                        <input
                                            id="floor"
                                            value={registerForm.floor}
                                            onChange={(e) =>
                                                updateRegisterField(
                                                    "floor",
                                                    sanitizeSimpleText(e.target.value, 20),
                                                )
                                            }
                                            onBlur={() => handleBlur("floor")}
                                            className={`${fieldClass({
                                                hasError: Boolean(registerErrors.floor),
                                                valid: isValid("floor"),
                                            })} text-center`}
                                            placeholder="طبقه"
                                            maxLength={20}
                                            aria-label="طبقه"
                                            aria-invalid={Boolean(registerErrors.floor)}
                                            aria-describedby={registerErrors.floor ? "err-floor" : undefined}
                                        />
                                    </Field>

                                    <Field
                                        width="w-[6.5rem]"
                                        valid={isValid("unit")}
                                        error={registerErrors.unit}
                                        errorId="err-unit"
                                    >
                                        <input
                                            id="unit"
                                            value={registerForm.unit}
                                            onChange={(e) =>
                                                updateRegisterField(
                                                    "unit",
                                                    sanitizeSimpleText(e.target.value, 20),
                                                )
                                            }
                                            onBlur={() => handleBlur("unit")}
                                            className={`${fieldClass({
                                                hasError: Boolean(registerErrors.unit),
                                                valid: isValid("unit"),
                                            })} text-center`}
                                            placeholder="واحد"
                                            maxLength={20}
                                            aria-label="واحد"
                                            aria-invalid={Boolean(registerErrors.unit)}
                                            aria-describedby={registerErrors.unit ? "err-unit" : undefined}
                                        />
                                    </Field>
                                </div>
                            </Row>

                            <Row htmlFor="postal_code" label="کد پستی">
                                <Field
                                    width="w-full max-w-[13rem]"
                                    valid={isValid("postal_code")}
                                    error={registerErrors.postal_code}
                                    errorId="err-postal_code"
                                >
                                    <input
                                        id="postal_code"
                                        value={registerForm.postal_code}
                                        onChange={(e) =>
                                            updateRegisterField("postal_code", onlyDigits(e.target.value, 10))
                                        }
                                        onBlur={() => handleBlur("postal_code")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.postal_code),
                                            valid: isValid("postal_code"),
                                        })} tracking-[0.16em] tabular-nums`}
                                        placeholder="0000000000"
                                        inputMode="numeric"
                                        maxLength={10}
                                        autoComplete="postal-code"
                                        dir="ltr"
                                        aria-invalid={Boolean(registerErrors.postal_code)}
                                        aria-describedby={
                                            registerErrors.postal_code ? "err-postal_code" : undefined
                                        }
                                    />
                                </Field>
                            </Row>

                            <Row htmlFor="phone" label="تلفن ثابت">
                                <Field
                                    width="w-full max-w-[13rem]"
                                    valid={isValid("phone")}
                                    error={registerErrors.phone}
                                    errorId="err-phone"
                                >
                                    <input
                                        id="phone"
                                        value={registerForm.phone}
                                        onChange={(e) =>
                                            updateRegisterField(
                                                "phone",
                                                normalizeLandlineInput(e.target.value, registerForm.phone),
                                            )
                                        }
                                        onBlur={() => handleBlur("phone")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.phone),
                                            valid: isValid("phone"),
                                        })} tracking-[0.14em] tabular-nums`}
                                        placeholder="0 و ۱۰ رقم"
                                        inputMode="numeric"
                                        maxLength={11}
                                        autoComplete="tel-national"
                                        dir="ltr"
                                        aria-invalid={Boolean(registerErrors.phone)}
                                        aria-describedby={registerErrors.phone ? "err-phone" : undefined}
                                    />
                                </Field>
                            </Row>
                        </Section>

                        {/* ═══ ۰۳ — امنیت ════════════════════════════════ */}
                        <Section index="۰۳" title="امنیت">

                            <Row htmlFor="password" label="رمز عبور" required>
                                <Field
                                    width="w-full max-w-[18rem]"
                                    valid={isValid("password")}
                                    error={registerErrors.password}
                                    errorId="err-password"
                                    trailing={
                                        hasPassword ? (
                                            <ToggleReveal
                                                shown={showPassword}
                                                onToggle={() => setShowPassword((v) => !v)}
                                                label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                                            />
                                        ) : undefined
                                    }
                                >
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={registerForm.password}
                                        onChange={(e) => updatePasswordField("password", e.target.value)}
                                        onBlur={() => handleBlur("password")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.password),
                                            valid: isValid("password"),
                                            withToggle: hasPassword,
                                        })} tracking-[0.12em]`}
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        dir="ltr"
                                        lang="en"
                                        inputMode="text"
                                        spellCheck={false}
                                        aria-invalid={Boolean(registerErrors.password)}
                                        aria-describedby={
                                            registerErrors.password ? "err-password" : undefined
                                        }
                                    />
                                </Field>

                                {hasPassword && (
                                    <div className="mt-3 w-full max-w-[18rem]">
                                        <div
                                            className="h-[2px] w-full overflow-hidden"
                                            style={{ background: T.hairline }}
                                            role="progressbar"
                                            aria-label="قدرت رمز عبور"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={strength.percent}
                                            aria-valuetext={strength.label}
                                        >
                                            <span
                                                className="block h-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${strength.percent}%`,
                                                    background: strength.color,
                                                }}
                                            />
                                        </div>
                                        <p
                                            className="mt-2 text-[10.5px] font-normal tracking-[0.06em]"
                                            style={{ color: T.ink3 }}
                                        >
                                            قدرت رمز — {strength.label}
                                        </p>
                                    </div>
                                )}
                            </Row>

                            <Row htmlFor="confirm_password" label="تکرار رمز عبور" required>
                                <Field
                                    width="w-full max-w-[18rem]"
                                    valid={isValid("confirm_password")}
                                    error={registerErrors.confirm_password}
                                    errorId="err-confirm_password"
                                    trailing={
                                        hasConfirm ? (
                                            <ToggleReveal
                                                shown={showConfirm}
                                                onToggle={() => setShowConfirm((v) => !v)}
                                                label={showConfirm ? "پنهان کردن تکرار رمز" : "نمایش تکرار رمز"}
                                            />
                                        ) : undefined
                                    }
                                >
                                    <input
                                        id="confirm_password"
                                        type={showConfirm ? "text" : "password"}
                                        value={registerForm.confirm_password}
                                        onChange={(e) =>
                                            updatePasswordField("confirm_password", e.target.value)
                                        }
                                        onBlur={() => handleBlur("confirm_password")}
                                        className={`${fieldClass({
                                            hasError: Boolean(registerErrors.confirm_password),
                                            valid: isValid("confirm_password"),
                                            withToggle: hasConfirm,
                                        })} tracking-[0.12em]`}
                                        minLength={8}
                                        maxLength={100}
                                        autoComplete="new-password"
                                        dir="ltr"
                                        lang="en"
                                        inputMode="text"
                                        spellCheck={false}
                                        aria-invalid={Boolean(registerErrors.confirm_password)}
                                        aria-describedby={
                                            registerErrors.confirm_password ? "err-confirm_password" : undefined
                                        }
                                    />
                                </Field>
                            </Row>
                        </Section>

                        {/* ── Actions ────────────────────────────────────── */}
                        <div className="mt-16 border-t pt-10" style={{ borderColor: T.hairline }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden px-8 py-[18px] text-[12px] font-medium tracking-[0.18em] transition-opacity duration-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[16rem]"
                                style={{ background: T.ink1, color: T.paper }}
                            >
                                <span className="relative z-10">
                                    {loading ? "در حال ثبت …" : "تکمیل ثبت‌نام"}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 origin-right scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 group-disabled:hidden"
                                    style={{ background: "#332F2B" }}
                                />
                            </button>

                            <div className="mt-4">
                                <Link
                                    href="/"
                                    className="block w-full border px-8 py-[17px] text-center text-[12px] font-medium tracking-[0.18em] transition-colors duration-300 hover:bg-[#F6F5F3] sm:w-auto sm:min-w-[16rem]"
                                    style={{ borderColor: T.hairline, color: T.ink2 }}
                                >
                                    بازگشت به خانه
                                </Link>
                            </div>

                            <p
                                className="mt-8 text-[11.5px] font-light leading-[2]"
                                style={{ color: T.ink3 }}
                            >
                                با ثبت‌نام، شرایط استفاده و سیاست حفظ حریم خصوصی را می‌پذیرید.
                            </p>
                        </div>
                    </form>
                </div>
            </main>
            <CinematicFooter />
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Fallback + Page shell (Suspense boundary)                          */
/* ------------------------------------------------------------------ */

function RegisterSkeleton() {
    return (
        <main
            dir="rtl"
            className="min-h-screen"
            style={{ background: T.paper, color: T.ink1 }}
        >
            <div className="mx-auto w-full max-w-[42rem] px-6 pt-16 sm:px-10 sm:pt-24">
                <div
                    className="h-[34px] w-[9rem] animate-pulse"
                    style={{ background: T.smoke }}
                />
                <div className="mt-16 space-y-9">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-4 sm:gap-7">
                            <div
                                className="h-[14px] w-[5.5rem] shrink-0 animate-pulse sm:w-[8.5rem]"
                                style={{ background: T.smoke }}
                            />
                            <div
                                className="h-px flex-1 self-end"
                                style={{ background: T.hairline }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<RegisterSkeleton />}>
            <RegisterView />
        </Suspense>
    );
}
