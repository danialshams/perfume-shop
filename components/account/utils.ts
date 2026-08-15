/* ------------------------------------------------------------------ */
/*  Design tokens — همان توکن‌های فرم ثبت‌نام                          */
/* ------------------------------------------------------------------ */

export const T = {
  paper: "#F8F8F8",
  ink1: "#1A1A1A",
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

export type ProfileForm = {
  first_name: string;
  last_name: string;
  mobile: string;
  province: string;
  city: string;
  address: string;
  plaque: string;
  floor: string;
  unit: string;
  postal_code: string;
  phone: string;
};

export type PasswordForm = {
  current_password: string;
  password: string;
  confirm_password: string;
};

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;
export type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

export type ProfileTouched = Partial<Record<keyof ProfileForm, boolean>>;
export type PasswordTouched = Partial<Record<keyof PasswordForm, boolean>>;

export type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  errors?: Array<{ message?: string; path?: Array<string | number> }>;
  data?: T;
};

export const emptyProfile: ProfileForm = {
  first_name: "",
  last_name: "",
  mobile: "",
  province: "",
  city: "",
  address: "",
  plaque: "",
  floor: "",
  unit: "",
  postal_code: "",
  phone: "",
};

export const emptyPassword: PasswordForm = {
  current_password: "",
  password: "",
  confirm_password: "",
};

export const PROFILE_KEYS = Object.keys(emptyProfile) as Array<
  keyof ProfileForm
>;

/** فیلدهای الزامی — طبقه، واحد، کد پستی و تلفن ثابت اختیاری‌اند */
export const PROFILE_REQUIRED_KEYS: Array<keyof ProfileForm> = [
  "first_name",
  "last_name",
  "mobile",
  "province",
  "city",
  "address",
  "plaque",
];

export const ADDRESS_MAX = 250;
export const ADDRESS_COUNTER_FROM = Math.floor(ADDRESS_MAX * 0.8); // 200

export const NON_LATIN_PASSWORD_MESSAGE =
  "رمز عبور باید با حروف و کاراکترهای انگلیسی باشد";

/* ------------------------------------------------------------------ */
/*  Regex                                                              */
/* ------------------------------------------------------------------ */

const persianArabicDigitsMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export const mobileRegex = /^09\d{9}$/;
/** تلفن ثابت: فقط شروع با ۰ و مجموعاً ۱۱ رقم — بدون محدودیت کد شهر */
export const landlineRegex = /^0\d{10}$/;
export const postalCodeRegex = /^\d{10}$/;
export const nameRegex = /^[\u0600-\u06FFa-zA-Z\s‌-]+$/;
export const simpleTextRegex = /^[\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،]+$/;
/** فقط ASCII قابل چاپ — هیچ حرف فارسی/عربی و هیچ رقم غیرلاتین */
export const latinOnlyRegex = /^[\x20-\x7E]+$/;
export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

/* ------------------------------------------------------------------ */
/*  Normalizers                                                        */
/* ------------------------------------------------------------------ */

export function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (d) => persianArabicDigitsMap[d] || d);
}

export function onlyDigits(value: string, maxLength: number) {
  return toEnglishDigits(value).replace(/\D/g, "").slice(0, maxLength);
}

export function normalizeMobileInput(value: string, previousValue: string) {
  const digits = onlyDigits(value, 11);
  if (!digits) return "";
  if (digits.length === 1) return digits === "0" ? digits : previousValue;
  if (!digits.startsWith("09")) return previousValue;
  return digits;
}

/** فقط الزام شروع با ۰ و سقف ۱۱ رقم */
export function normalizeLandlineInput(value: string, previousValue: string) {
  const digits = onlyDigits(value, 11);
  if (!digits) return "";
  if (!digits.startsWith("0")) return previousValue;
  return digits;
}

export function sanitizeName(value: string, maxLength = 50) {
  return value
    .replace(/[0-9۰-۹٠-٩]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z\s‌-]/g, "")
    .slice(0, maxLength);
}

export function sanitizeSimpleText(value: string, maxLength: number) {
  return toEnglishDigits(value)
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،]/g, "")
    .slice(0, maxLength);
}

export function sanitizeAddress(value: string) {
  return toEnglishDigits(value)
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s‌\-\/.,،#()]/g, "")
    .slice(0, ADDRESS_MAX);
}

/**
 * رمز عبور: هر کاراکتر خارج از ASCII قابل چاپ حذف می‌شود.
 * blocked مشخص می‌کند چیزی حذف شده تا خطای راهنما نشان داده شود.
 */
export function sanitizePassword(value: string): {
  value: string;
  blocked: boolean;
} {
  const capped = value.slice(0, 100);
  const cleaned = capped.replace(/[^\x20-\x7E]/g, "");
  return { value: cleaned, blocked: cleaned.length !== capped.length };
}

/* ------------------------------------------------------------------ */
/*  Profile helpers                                                    */
/* ------------------------------------------------------------------ */

export function normalizeProfile(form: ProfileForm): ProfileForm {
  return PROFILE_KEYS.reduce<ProfileForm>(
    (acc, key) => {
      acc[key] = (form[key] ?? "").trim();
      return acc;
    },
    { ...emptyProfile },
  );
}

export function isSameProfile(a: ProfileForm, b: ProfileForm) {
  return PROFILE_KEYS.every((key) => a[key] === b[key]);
}

export function hasAllRequired(form: ProfileForm) {
  return PROFILE_REQUIRED_KEYS.every((key) => Boolean(form[key].trim()));
}

/* ------------------------------------------------------------------ */
/*  Password strength — یک خط یکسره با طیف رنگ                        */
/* ------------------------------------------------------------------ */

export type Strength = {
  score: number;
  percent: number;
  label: string;
  color: string;
};

export function getPasswordStrength(password: string): Strength {
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
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

export function validateProfileForm(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};

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

  // اختیاری‌ها
  if (form.floor.trim() && !simpleTextRegex.test(form.floor.trim())) {
    errors.floor = "طبقه فقط حروف و عدد";
  }

  if (form.unit.trim() && !simpleTextRegex.test(form.unit.trim())) {
    errors.unit = "واحد فقط حروف و عدد";
  }

  if (
    form.postal_code.trim() &&
    !postalCodeRegex.test(form.postal_code.trim())
  ) {
    errors.postal_code = "کد پستی باید دقیقاً ۱۰ رقم باشد";
  }

  if (form.phone.trim() && !landlineRegex.test(form.phone.trim())) {
    errors.phone = "تلفن ثابت باید ۱۱ رقم و با ۰ شروع شود";
  }

  return errors;
}

export function validatePasswordForm(form: PasswordForm): PasswordErrors {
  const errors: PasswordErrors = {};

  if (!form.current_password) {
    errors.current_password = "رمز عبور فعلی الزامی است";
  } else if (!latinOnlyRegex.test(form.current_password)) {
    errors.current_password = NON_LATIN_PASSWORD_MESSAGE;
  }

  if (!form.password) {
    errors.password = "رمز عبور جدید الزامی است";
  } else if (!latinOnlyRegex.test(form.password)) {
    errors.password = NON_LATIN_PASSWORD_MESSAGE;
  } else if (!strongPasswordRegex.test(form.password)) {
    errors.password =
      "حداقل ۸ کاراکتر، شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص";
  } else if (form.current_password && form.password === form.current_password) {
    errors.password = "رمز جدید نباید با رمز فعلی یکسان باشد";
  }

  if (!form.confirm_password) {
    errors.confirm_password = "تکرار رمز عبور الزامی است";
  } else if (!latinOnlyRegex.test(form.confirm_password)) {
    errors.confirm_password = NON_LATIN_PASSWORD_MESSAGE;
  } else if (form.password !== form.confirm_password) {
    errors.confirm_password = "رمز عبور و تکرار آن یکسان نیستند";
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */

export async function parseApiResponse<T>(
  res: Response,
): Promise<ApiResponse<T>> {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    const trimmed = text.trim();
    const isHtml =
      trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");

    if (isHtml) {
      throw new Error(
        `پاسخ API از نوع HTML است، نه JSON. مسیر API یا proxy را بررسی کنید. Status: ${res.status}`,
      );
    }

    throw new Error(text || `پاسخ API معتبر نیست. Status: ${res.status}`);
  }

  return res.json();
}
