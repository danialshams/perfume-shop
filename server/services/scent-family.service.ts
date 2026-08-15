import {
  createScentFamily,
  deleteScentFamily,
  findScentFamilyById,
  listScentFamilies,
  updateScentFamily,
  type ScentFamilyCreateInput,
  type ScentFamilyFilters,
  type ScentFamilyUpdateInput,
} from "@/server/repositories/scent-family.repository";

function normalizePersianText(value: string) {
  return value
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

function toScentFamilySlug(name: string) {
  const normalized = normalizePersianText(name);

  const slug = normalized
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  /**
   * برای نام‌های فارسی معمولاً slug فارسی ساخته می‌شود.
   * fallback فقط برای اطمینان از خالی نبودن slug است.
   */
  return slug || `scent-family-${Date.now()}`;
}

export class ScentFamilyService {
  async getList(filters: ScentFamilyFilters = {}) {
    return listScentFamilies(filters);
  }

  async getById(id: number) {
    return findScentFamilyById(id);
  }

  async create(data: Omit<ScentFamilyCreateInput, "slug">) {
    const normalizedName = normalizePersianText(data.name);

    const id = await createScentFamily({
      ...data,
      name: normalizedName,
      slug: toScentFamilySlug(normalizedName),
    });

    return this.getById(id);
  }

  async update(id: number, data: Omit<ScentFamilyUpdateInput, "slug">) {
    const normalizedName =
      data.name !== undefined ? normalizePersianText(data.name) : undefined;

    return updateScentFamily(id, {
      ...data,
      ...(normalizedName
        ? {
            name: normalizedName,
            slug: toScentFamilySlug(normalizedName),
          }
        : {}),
    });
  }

  async delete(id: number) {
    return deleteScentFamily(id);
  }
}

export const scentFamilyService = new ScentFamilyService();
