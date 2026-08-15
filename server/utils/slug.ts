export function normalizePersianText(text: string) {
  return text.trim().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ");
}

export function toSlug(text: string) {
  return normalizePersianText(text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
