"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ADDRESS_COUNTER_FROM,
    ADDRESS_MAX,
    NON_LATIN_PASSWORD_MESSAGE,
    PROFILE_KEYS,
    PasswordErrors,
    PasswordForm,
    PasswordTouched,
    ProfileErrors,
    ProfileForm,
    ProfileTouched,
    T,
    emptyPassword,
    getPasswordStrength,
    hasAllRequired,
    isSameProfile,
    normalizeLandlineInput,
    normalizeMobileInput,
    normalizeProfile,
    onlyDigits,
    parseApiResponse,
    sanitizeAddress,
    sanitizeName,
    sanitizePassword,
    sanitizeSimpleText,
    validatePasswordForm,
    validateProfileForm,
} from "./utils";
import {
    Field,
    GhostButton,
    PrimaryButton,
    Row,
    Section,
    ToggleReveal,
    fieldClass,
} from "./FormPrimitives";

type ProfileSectionProps = {
    initialData: ProfileForm;
};

type ToastType = "success" | "error";

type ToastState = {
    mounted: boolean;
    visible: boolean;
    message: string;
    type: ToastType;
};

export default function ProfileSection({ initialData }: ProfileSectionProps) {
    const router = useRouter();

    const [baseProfile, setBaseProfile] = useState<ProfileForm>(() =>
        normalizeProfile(initialData),
    );
    const [profileForm, setProfileForm] = useState<ProfileForm>(() =>
        normalizeProfile(initialData),
    );
    const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPassword);

    const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

    const [profileTouched, setProfileTouched] = useState<ProfileTouched>({});
    const [passwordTouched, setPasswordTouched] = useState<PasswordTouched>({});

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [toast, setToast] = useState<ToastState>({
        mounted: false,
        visible: false,
        message: "",
        type: "success",
    });

    const addressRef = useRef<HTMLTextAreaElement | null>(null);
    const toastHideTimerRef = useRef<number | null>(null);
    const toastUnmountTimerRef = useRef<number | null>(null);

    /* ── Derived ────────────────────────────────────────────── */

    const normalizedProfile = useMemo(
        () => normalizeProfile(profileForm),
        [profileForm],
    );

    const profileDirty = useMemo(
        () => !isSameProfile(normalizedProfile, baseProfile),
        [normalizedProfile, baseProfile],
    );

    const passwordDirty = useMemo(
        () =>
            Boolean(
                passwordForm.current_password ||
                passwordForm.password ||
                passwordForm.confirm_password,
            ),
        [passwordForm],
    );

    const canSubmitProfile =
        profileDirty && hasAllRequired(normalizedProfile) && !profileLoading;
    const canSubmitPassword = passwordDirty && !passwordLoading;

    const strength = useMemo(
        () => getPasswordStrength(passwordForm.password),
        [passwordForm.password],
    );

    const addressLength = profileForm.address.length;

    /* ── Effects ────────────────────────────────────────────── */

    /** ارتفاع نشانی دقیقا به اندازه محتوا */
    useEffect(() => {
        const el = addressRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [profileForm.address]);

    useEffect(() => {
        if (!passwordForm.current_password) setShowCurrent(false);
    }, [passwordForm.current_password]);

    useEffect(() => {
        if (!passwordForm.password) setShowNew(false);
    }, [passwordForm.password]);

    useEffect(() => {
        if (!passwordForm.confirm_password) setShowConfirm(false);
    }, [passwordForm.confirm_password]);

    useEffect(() => {
        return () => {
            if (toastHideTimerRef.current) {
                window.clearTimeout(toastHideTimerRef.current);
            }
            if (toastUnmountTimerRef.current) {
                window.clearTimeout(toastUnmountTimerRef.current);
            }
        };
    }, []);

    /* ── Toast ──────────────────────────────────────────────── */

    function showToast(message: string, type: ToastType) {
        if (toastHideTimerRef.current) {
            window.clearTimeout(toastHideTimerRef.current);
            toastHideTimerRef.current = null;
        }
        if (toastUnmountTimerRef.current) {
            window.clearTimeout(toastUnmountTimerRef.current);
            toastUnmountTimerRef.current = null;
        }

        setToast({ mounted: true, visible: false, message, type });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setToast((prev) => ({ ...prev, visible: true }));
            });
        });

        toastHideTimerRef.current = window.setTimeout(() => {
            setToast((prev) => ({ ...prev, visible: false }));
        }, 2600);

        toastUnmountTimerRef.current = window.setTimeout(() => {
            setToast((prev) => ({ ...prev, mounted: false }));
        }, 3200);
    }

    /* ── Field updates ──────────────────────────────────────── */

    function updateProfileField<K extends keyof ProfileForm>(
        field: K,
        value: ProfileForm[K],
    ) {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
        setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    /** رمز عبور: کاراکتر غیرلاتین حذف و خطای راهنما نمایش داده می‌شود */
    function updatePasswordField(field: keyof PasswordForm, rawValue: string) {
        const { value, blocked } = sanitizePassword(rawValue);

        setPasswordForm((prev) => ({ ...prev, [field]: value }));
        setPasswordErrors((prev) => ({
            ...prev,
            [field]: blocked ? NON_LATIN_PASSWORD_MESSAGE : undefined,
        }));
    }

    function handleProfileBlur(field: keyof ProfileForm) {
        setProfileTouched((prev) => ({ ...prev, [field]: true }));

        const all = validateProfileForm(normalizeProfile(profileForm));
        setProfileErrors((prev) => ({ ...prev, [field]: all[field] }));
    }

    function handlePasswordBlur(field: keyof PasswordForm) {
        setPasswordTouched((prev) => ({ ...prev, [field]: true }));

        const all = validatePasswordForm(passwordForm);

        setPasswordErrors((prev) => {
            const next: PasswordErrors = { ...prev, [field]: all[field] };

            if (field === "password" && passwordTouched.confirm_password) {
                next.confirm_password = all.confirm_password;
            }
            if (field === "confirm_password" && passwordTouched.password) {
                next.password = all.password;
            }

            return next;
        });
    }

    function isProfileValid(field: keyof ProfileForm) {
        return Boolean(
            profileTouched[field] &&
            profileForm[field].trim() &&
            !profileErrors[field],
        );
    }

    function isPasswordValid(field: keyof PasswordForm) {
        return Boolean(
            passwordTouched[field] && passwordForm[field] && !passwordErrors[field],
        );
    }

    function handleResetProfile() {
        setProfileForm(baseProfile);
        setProfileErrors({});
        setProfileTouched({});
    }

    /* ── Submit: profile ────────────────────────────────────── */

    async function handleUpdateProfile(e: FormEvent) {
        e.preventDefault();
        if (!canSubmitProfile) return;

        const payload = normalizeProfile(profileForm);
        const errors = validateProfileForm(payload);

        setProfileErrors(errors);
        setProfileTouched(
            PROFILE_KEYS.reduce<ProfileTouched>((acc, key) => {
                acc[key] = true;
                return acc;
            }, {}),
        );

        if (Object.keys(errors).length > 0) {
            showToast("لطفا موارد مشخص‌شده را اصلاح کنید", "error");
            return;
        }

        setProfileLoading(true);

        try {
            const res = await fetch("/api/v1/customers/account/profile", {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (res.status === 401) {
                router.push("/auth");
                return;
            }

            const data = await parseApiResponse(res);

            if (!res.ok || data?.success === false) {
                const message =
                    data?.errors?.[0]?.message ||
                    data?.message ||
                    "ویرایش اطلاعات ناموفق بود";
                throw new Error(message);
            }

            setProfileForm(payload);
            setBaseProfile(payload);
            showToast("اطلاعات حساب بروزرسانی شد", "success");
            router.refresh();
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "خطا در ویرایش اطلاعات",
                "error",
            );
        } finally {
            setProfileLoading(false);
        }
    }

    /* ── Submit: password ───────────────────────────────────── */

    async function handleUpdatePassword(e: FormEvent) {
        e.preventDefault();
        if (!canSubmitPassword) return;

        const errors = validatePasswordForm(passwordForm);

        setPasswordErrors(errors);
        setPasswordTouched({
            current_password: true,
            password: true,
            confirm_password: true,
        });

        if (Object.keys(errors).length > 0) {
            showToast("لطفا موارد مشخص‌شده را اصلاح کنید", "error");
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await fetch("/api/v1/customers/account/password", {
                method: "PATCH",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(passwordForm),
            });

            if (res.status === 401) {
                router.push("/auth");
                return;
            }

            const data = await parseApiResponse(res);

            if (!res.ok || data?.success === false) {
                const message =
                    data?.errors?.[0]?.message ||
                    data?.message ||
                    "تغییر رمز عبور ناموفق بود";
                throw new Error(message);
            }

            setPasswordForm(emptyPassword);
            setPasswordErrors({});
            setPasswordTouched({});
            showToast("رمز عبور تغییر کرد", "success");
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "خطا در تغییر رمز عبور",
                "error",
            );
        } finally {
            setPasswordLoading(false);
        }
    }

    /* ── Render ─────────────────────────────────────────────── */

    return (
        <>
            {/* ── Toast ──────────────────────────────────────────── */}
            {toast.mounted && (
                <div className="pointer-events-none  fixed inset-x-0 top-6 z-[140] flex justify-center px-6">
                    <div
                        className={[
                            "pointer-events-auto flex min-w-[240px] max-w-[92vw] items-start gap-3 border-r-2 py-4 pl-6 pr-5 transition-all duration-[500ms] ease-out",
                            toast.visible
                                ? "translate-y-0 opacity-100"
                                : "-translate-y-3 opacity-0",
                        ].join(" ")}
                        style={{
                            borderColor: toast.type === "success" ? T.ok : T.danger,
                            background: T.paper,
                            boxShadow: "0 18px 45px rgba(26,26,26,0.08)",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            className="mt-[7px] inline-block h-[4px] w-[4px] shrink-0 rounded-full"
                            style={{
                                background: toast.type === "success" ? T.ok : T.danger,
                            }}
                        />
                        <p
                            className="text-[12.5px] font-normal leading-[1.9]"
                            style={{ color: T.ink1 }}
                        >
                            {toast.message}
                        </p>
                    </div>
                </div>
            )}

            {/* ═══════════════ فرم اطلاعات و نشانی ═══════════════ */}
            <form onSubmit={handleUpdateProfile} noValidate>

                {/* ═══ ۰۱ — هویت ═════════════════════════════════ */}
                <Section index="۰۱" title="هویت" spaced={false}>

                    <Row htmlFor="first_name" label="نام و نام خانوادگی" required>
                        <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
                            <Field
                                width="w-full max-w-[13rem] sm:w-[13rem]"
                                valid={isProfileValid("first_name")}
                                error={profileErrors.first_name}
                                errorId="p-err-first_name"
                            >
                                <input
                                    id="first_name"
                                    value={profileForm.first_name}
                                    onChange={(e) =>
                                        updateProfileField("first_name", sanitizeName(e.target.value))
                                    }
                                    onBlur={() => handleProfileBlur("first_name")}
                                    className={fieldClass({
                                        hasError: Boolean(profileErrors.first_name),
                                        valid: isProfileValid("first_name"),
                                    })}
                                    placeholder="نام"
                                    maxLength={50}
                                    autoComplete="given-name"
                                    aria-label="نام"
                                    aria-invalid={Boolean(profileErrors.first_name)}
                                    aria-describedby={
                                        profileErrors.first_name ? "p-err-first_name" : undefined
                                    }
                                />
                            </Field>

                            <Field
                                width="w-full max-w-[13rem] sm:w-[13rem]"
                                valid={isProfileValid("last_name")}
                                error={profileErrors.last_name}
                                errorId="p-err-last_name"
                            >
                                <input
                                    id="last_name"
                                    value={profileForm.last_name}
                                    onChange={(e) =>
                                        updateProfileField("last_name", sanitizeName(e.target.value))
                                    }
                                    onBlur={() => handleProfileBlur("last_name")}
                                    className={fieldClass({
                                        hasError: Boolean(profileErrors.last_name),
                                        valid: isProfileValid("last_name"),
                                    })}
                                    placeholder="نام خانوادگی"
                                    maxLength={50}
                                    autoComplete="family-name"
                                    aria-label="نام خانوادگی"
                                    aria-invalid={Boolean(profileErrors.last_name)}
                                    aria-describedby={
                                        profileErrors.last_name ? "p-err-last_name" : undefined
                                    }
                                />
                            </Field>
                        </div>
                    </Row>

                    <Row htmlFor="mobile" label="شماره موبایل" required>
                        <Field
                            width="w-full max-w-[13rem]"
                            valid={isProfileValid("mobile")}
                            error={profileErrors.mobile}
                            errorId="p-err-mobile"
                        >
                            <input
                                id="mobile"
                                value={profileForm.mobile}
                                onChange={(e) =>
                                    setProfileForm((prev) => {
                                        const mobile = normalizeMobileInput(
                                            e.target.value,
                                            prev.mobile,
                                        );
                                        setProfileErrors((old) => ({ ...old, mobile: undefined }));
                                        return { ...prev, mobile };
                                    })
                                }
                                onBlur={() => handleProfileBlur("mobile")}
                                className={`${fieldClass({
                                    hasError: Boolean(profileErrors.mobile),
                                    valid: isProfileValid("mobile"),
                                })} tracking-[0.14em] tabular-nums`}
                                placeholder="09120000000"
                                inputMode="numeric"
                                maxLength={11}
                                autoComplete="tel"
                                dir="ltr"
                                aria-invalid={Boolean(profileErrors.mobile)}
                                aria-describedby={
                                    profileErrors.mobile ? "p-err-mobile" : undefined
                                }
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
                                valid={isProfileValid("province")}
                                error={profileErrors.province}
                                errorId="p-err-province"
                            >
                                <input
                                    id="province"
                                    value={profileForm.province}
                                    onChange={(e) =>
                                        updateProfileField("province", sanitizeName(e.target.value))
                                    }
                                    onBlur={() => handleProfileBlur("province")}
                                    className={fieldClass({
                                        hasError: Boolean(profileErrors.province),
                                        valid: isProfileValid("province"),
                                    })}
                                    placeholder="استان"
                                    maxLength={50}
                                    autoComplete="address-level1"
                                    aria-label="استان"
                                    aria-invalid={Boolean(profileErrors.province)}
                                    aria-describedby={
                                        profileErrors.province ? "p-err-province" : undefined
                                    }
                                />
                            </Field>

                            <Field
                                width="w-full max-w-[11rem] sm:w-[11rem]"
                                valid={isProfileValid("city")}
                                error={profileErrors.city}
                                errorId="p-err-city"
                            >
                                <input
                                    id="city"
                                    value={profileForm.city}
                                    onChange={(e) =>
                                        updateProfileField("city", sanitizeName(e.target.value))
                                    }
                                    onBlur={() => handleProfileBlur("city")}
                                    className={fieldClass({
                                        hasError: Boolean(profileErrors.city),
                                        valid: isProfileValid("city"),
                                    })}
                                    placeholder="شهر"
                                    maxLength={50}
                                    autoComplete="address-level2"
                                    aria-label="شهر"
                                    aria-invalid={Boolean(profileErrors.city)}
                                    aria-describedby={
                                        profileErrors.city ? "p-err-city" : undefined
                                    }
                                />
                            </Field>
                        </div>
                    </Row>

                    <Row htmlFor="address" label="نشانی کامل" required>
                        <Field
                            width="w-full"
                            error={profileErrors.address}
                            errorId="p-err-address"
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
                                value={profileForm.address}
                                onChange={(e) =>
                                    updateProfileField("address", sanitizeAddress(e.target.value))
                                }
                                onBlur={() => handleProfileBlur("address")}
                                className={`${fieldClass({
                                    hasError: Boolean(profileErrors.address),
                                })} resize-none overflow-hidden`}
                                rows={1}
                                maxLength={ADDRESS_MAX}
                                placeholder="خیابان، کوچه، نشانه‌های کمکی"
                                autoComplete="street-address"
                                aria-invalid={Boolean(profileErrors.address)}
                                aria-describedby={
                                    profileErrors.address ? "p-err-address" : undefined
                                }
                            />
                        </Field>
                    </Row>

                    <Row htmlFor="plaque" label="پلاک / طبقه / واحد" required>
                        <div className="flex flex-wrap items-start gap-x-6 gap-y-5">
                            <Field
                                width="w-[6.5rem]"
                                valid={isProfileValid("plaque")}
                                error={profileErrors.plaque}
                                errorId="p-err-plaque"
                            >
                                <input
                                    id="plaque"
                                    value={profileForm.plaque}
                                    onChange={(e) =>
                                        updateProfileField(
                                            "plaque",
                                            sanitizeSimpleText(e.target.value, 20),
                                        )
                                    }
                                    onBlur={() => handleProfileBlur("plaque")}
                                    className={`${fieldClass({
                                        hasError: Boolean(profileErrors.plaque),
                                        valid: isProfileValid("plaque"),
                                    })} text-center`}
                                    placeholder="پلاک"
                                    maxLength={20}
                                    aria-label="پلاک"
                                    aria-invalid={Boolean(profileErrors.plaque)}
                                    aria-describedby={
                                        profileErrors.plaque ? "p-err-plaque" : undefined
                                    }
                                />
                            </Field>

                            <Field
                                width="w-[6.5rem]"
                                valid={isProfileValid("floor")}
                                error={profileErrors.floor}
                                errorId="p-err-floor"
                            >
                                <input
                                    id="floor"
                                    value={profileForm.floor}
                                    onChange={(e) =>
                                        updateProfileField(
                                            "floor",
                                            sanitizeSimpleText(e.target.value, 20),
                                        )
                                    }
                                    onBlur={() => handleProfileBlur("floor")}
                                    className={`${fieldClass({
                                        hasError: Boolean(profileErrors.floor),
                                        valid: isProfileValid("floor"),
                                    })} text-center`}
                                    placeholder="طبقه"
                                    maxLength={20}
                                    aria-label="طبقه"
                                    aria-invalid={Boolean(profileErrors.floor)}
                                    aria-describedby={
                                        profileErrors.floor ? "p-err-floor" : undefined
                                    }
                                />
                            </Field>

                            <Field
                                width="w-[6.5rem]"
                                valid={isProfileValid("unit")}
                                error={profileErrors.unit}
                                errorId="p-err-unit"
                            >
                                <input
                                    id="unit"
                                    value={profileForm.unit}
                                    onChange={(e) =>
                                        updateProfileField(
                                            "unit",
                                            sanitizeSimpleText(e.target.value, 20),
                                        )
                                    }
                                    onBlur={() => handleProfileBlur("unit")}
                                    className={`${fieldClass({
                                        hasError: Boolean(profileErrors.unit),
                                        valid: isProfileValid("unit"),
                                    })} text-center`}
                                    placeholder="واحد"
                                    maxLength={20}
                                    aria-label="واحد"
                                    aria-invalid={Boolean(profileErrors.unit)}
                                    aria-describedby={
                                        profileErrors.unit ? "p-err-unit" : undefined
                                    }
                                />
                            </Field>
                        </div>
                    </Row>

                    <Row htmlFor="postal_code" label="کد پستی">
                        <Field
                            width="w-full max-w-[13rem]"
                            valid={isProfileValid("postal_code")}
                            error={profileErrors.postal_code}
                            errorId="p-err-postal_code"
                        >
                            <input
                                id="postal_code"
                                value={profileForm.postal_code}
                                onChange={(e) =>
                                    updateProfileField("postal_code", onlyDigits(e.target.value, 10))
                                }
                                onBlur={() => handleProfileBlur("postal_code")}
                                className={`${fieldClass({
                                    hasError: Boolean(profileErrors.postal_code),
                                    valid: isProfileValid("postal_code"),
                                })} tracking-[0.16em] tabular-nums`}
                                placeholder="0000000000"
                                inputMode="numeric"
                                maxLength={10}
                                autoComplete="postal-code"
                                dir="ltr"
                                aria-invalid={Boolean(profileErrors.postal_code)}
                                aria-describedby={
                                    profileErrors.postal_code ? "p-err-postal_code" : undefined
                                }
                            />
                        </Field>
                    </Row>

                    <Row htmlFor="phone" label="تلفن ثابت">
                        <Field
                            width="w-full max-w-[13rem]"
                            valid={isProfileValid("phone")}
                            error={profileErrors.phone}
                            errorId="p-err-phone"
                        >
                            <input
                                id="phone"
                                value={profileForm.phone}
                                onChange={(e) =>
                                    setProfileForm((prev) => {
                                        const phone = normalizeLandlineInput(
                                            e.target.value,
                                            prev.phone,
                                        );
                                        setProfileErrors((old) => ({ ...old, phone: undefined }));
                                        return { ...prev, phone };
                                    })
                                }
                                onBlur={() => handleProfileBlur("phone")}
                                className={`${fieldClass({
                                    hasError: Boolean(profileErrors.phone),
                                    valid: isProfileValid("phone"),
                                })} tracking-[0.14em] tabular-nums`}
                                placeholder="0 و ۱۰ رقم"
                                inputMode="numeric"
                                maxLength={11}
                                autoComplete="tel-national"
                                dir="ltr"
                                aria-invalid={Boolean(profileErrors.phone)}
                                aria-describedby={
                                    profileErrors.phone ? "p-err-phone" : undefined
                                }
                            />
                        </Field>
                    </Row>
                </Section>

                {/* ── Actions: profile ───────────────────────────── */}
                <div className="mt-14 border-t pt-10" style={{ borderColor: T.hairline }}>
                    <PrimaryButton disabled={!canSubmitProfile}>
                        {profileLoading ? "در حال ذخیره …" : "ذخیره تغییرات"}
                    </PrimaryButton>

                    {profileDirty && (
                        <div className="mt-4">
                            <GhostButton
                                onClick={handleResetProfile}
                                disabled={profileLoading}
                            >
                                بازگرداندن تغییرات
                            </GhostButton>
                        </div>
                    )}

                    
                </div>
            </form>

            {/* ═══════════════ فرم تغییر رمز عبور ═══════════════ */}
            <form onSubmit={handleUpdatePassword} noValidate>
                <Section index="۰۳" title="امنیت">

                    <Row htmlFor="current_password" label="رمز عبور فعلی" required>
                        <Field
                            width="w-full max-w-[18rem]"
                            valid={isPasswordValid("current_password")}
                            error={passwordErrors.current_password}
                            errorId="s-err-current_password"
                            trailing={
                                passwordForm.current_password ? (
                                    <ToggleReveal
                                        shown={showCurrent}
                                        onToggle={() => setShowCurrent((v) => !v)}
                                        label={
                                            showCurrent ? "پنهان کردن رمز فعلی" : "نمایش رمز فعلی"
                                        }
                                    />
                                ) : undefined
                            }
                        >
                            <input
                                id="current_password"
                                type={showCurrent ? "text" : "password"}
                                value={passwordForm.current_password}
                                onChange={(e) =>
                                    updatePasswordField("current_password", e.target.value)
                                }
                                onBlur={() => handlePasswordBlur("current_password")}
                                className={`${fieldClass({
                                    hasError: Boolean(passwordErrors.current_password),
                                    valid: isPasswordValid("current_password"),
                                    withToggle: Boolean(passwordForm.current_password),
                                })} tracking-[0.12em]`}
                                maxLength={100}
                                autoComplete="current-password"
                                dir="ltr"
                                lang="en"
                                inputMode="text"
                                spellCheck={false}
                                aria-invalid={Boolean(passwordErrors.current_password)}
                                aria-describedby={
                                    passwordErrors.current_password
                                        ? "s-err-current_password"
                                        : undefined
                                }
                            />
                        </Field>
                    </Row>

                    <Row htmlFor="new_password" label="رمز عبور جدید" required>
                        <Field
                            width="w-full max-w-[18rem]"
                            valid={isPasswordValid("password")}
                            error={passwordErrors.password}
                            errorId="s-err-password"
                            trailing={
                                passwordForm.password ? (
                                    <ToggleReveal
                                        shown={showNew}
                                        onToggle={() => setShowNew((v) => !v)}
                                        label={showNew ? "پنهان کردن رمز جدید" : "نمایش رمز جدید"}
                                    />
                                ) : undefined
                            }
                        >
                            <input
                                id="new_password"
                                type={showNew ? "text" : "password"}
                                value={passwordForm.password}
                                onChange={(e) => updatePasswordField("password", e.target.value)}
                                onBlur={() => handlePasswordBlur("password")}
                                className={`${fieldClass({
                                    hasError: Boolean(passwordErrors.password),
                                    valid: isPasswordValid("password"),
                                    withToggle: Boolean(passwordForm.password),
                                })} tracking-[0.12em]`}
                                minLength={8}
                                maxLength={100}
                                autoComplete="new-password"
                                dir="ltr"
                                lang="en"
                                inputMode="text"
                                spellCheck={false}
                                aria-invalid={Boolean(passwordErrors.password)}
                                aria-describedby={
                                    passwordErrors.password ? "s-err-password" : undefined
                                }
                            />
                        </Field>

                        {passwordForm.password && (
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

                    <Row htmlFor="confirm_password" label="تکرار رمز جدید" required>
                        <Field
                            width="w-full max-w-[18rem]"
                            valid={isPasswordValid("confirm_password")}
                            error={passwordErrors.confirm_password}
                            errorId="s-err-confirm_password"
                            trailing={
                                passwordForm.confirm_password ? (
                                    <ToggleReveal
                                        shown={showConfirm}
                                        onToggle={() => setShowConfirm((v) => !v)}
                                        label={
                                            showConfirm ? "پنهان کردن تکرار رمز" : "نمایش تکرار رمز"
                                        }
                                    />
                                ) : undefined
                            }
                        >
                            <input
                                id="confirm_password"
                                type={showConfirm ? "text" : "password"}
                                value={passwordForm.confirm_password}
                                onChange={(e) =>
                                    updatePasswordField("confirm_password", e.target.value)
                                }
                                onBlur={() => handlePasswordBlur("confirm_password")}
                                className={`${fieldClass({
                                    hasError: Boolean(passwordErrors.confirm_password),
                                    valid: isPasswordValid("confirm_password"),
                                    withToggle: Boolean(passwordForm.confirm_password),
                                })} tracking-[0.12em]`}
                                minLength={8}
                                maxLength={100}
                                autoComplete="new-password"
                                dir="ltr"
                                lang="en"
                                inputMode="text"
                                spellCheck={false}
                                aria-invalid={Boolean(passwordErrors.confirm_password)}
                                aria-describedby={
                                    passwordErrors.confirm_password
                                        ? "s-err-confirm_password"
                                        : undefined
                                }
                            />
                        </Field>
                    </Row>
                </Section>

                {/* ── Actions: password ──────────────────────────── */}
                <div className="mt-14 border-t pt-10" style={{ borderColor: T.hairline }}>
                    <PrimaryButton disabled={!canSubmitPassword}>
                        {passwordLoading ? "در حال تغییر …" : "تغییر رمز عبور"}
                    </PrimaryButton>
                </div>
            </form>
        </>
    );
}
