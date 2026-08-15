export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(Number(value || 0));
}

export function getErrorText(message: string) {
  switch (message) {
    case "INSUFFICIENT_STOCK":
      return "موجودی این محصول کافی نیست.";
    case "OUT_OF_STOCK":
      return "این محصول در حال حاضر ناموجود است.";
    case "CART_ITEM_NOT_FOUND":
      return "آیتم مورد نظر در سبد خرید پیدا نشد.";
    default:
      return "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
  }
}
