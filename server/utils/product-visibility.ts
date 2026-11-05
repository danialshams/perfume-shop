/**
 * Product publication rules for public storefront requests.
 * Admins can inspect drafts using their authenticated session.
 */
export function isPublicProduct(product: {
  status?: string | null;
  is_active?: boolean | number | null;
  deleted_at?: string | Date | null;
}): boolean {
  return product.status === "ACTIVE" &&
    (product.is_active === true || Number(product.is_active) === 1) &&
    !product.deleted_at;
}

export function visiblePublicVariants<T extends { is_active?: boolean | number | null }>(
  variants: T[] | undefined
): T[] {
  return (variants ?? []).filter(variant =>
    variant.is_active === true || Number(variant.is_active) === 1
  );
}
