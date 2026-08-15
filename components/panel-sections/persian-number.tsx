export function toPersianDigits(value: string | number) {
    return String(value).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function formatPrice(value?: string | number | null) {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return `${toPersianDigits(num.toLocaleString("fa-IR"))} تومان`;
}

export function formatNumber(value?: string | number | null) {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return toPersianDigits(num.toLocaleString("fa-IR"));
}

export function boolify(value: unknown) {
    return value === true || value === 1 || value === "1";
}
