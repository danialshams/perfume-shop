"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const redirect = searchParams.get("redirect") || "/admin/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message || "ورود ناموفق بود");
                return;
            }

            router.replace(redirect);
            router.refresh();
        } catch {
            setError("خطایی رخ داد. دوباره تلاش کنید.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-neutral-950 shadow-lg">
                            P
                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            ورود به پنل مدیریت
                        </h1>

                        <p className="mt-3 text-sm text-neutral-400">
                            برای دسترسی به بخش مدیریت وارد حساب ادمین شوید.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur sm:p-7">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-neutral-200"
                                >
                                    ایمیل
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    dir="ltr"
                                    inputMode="email"
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck={false}
                                    maxLength={190}
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white/30 focus:bg-white/[0.08]"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-neutral-200"
                                >
                                    رمز عبور
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    dir="ltr"
                                    autoComplete="current-password"
                                    minLength={8}
                                    maxLength={100}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-white/30 focus:bg-white/[0.08]"
                                />
                            </div>

                            {error ? (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-12 w-full rounded-2xl bg-white text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "در حال ورود..." : "ورود"}
                            </button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-xs text-neutral-500">
                        Perfume Shop Admin Panel
                    </p>
                </div>
            </div>
        </main>
    );
}
