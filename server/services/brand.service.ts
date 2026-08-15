import { brandRepository } from "@/server/repositories/brand.repository";
import { toSlug, normalizePersianText } from "@/server/utils/slug";

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = toSlug(name) || "brand";
  let slug = baseSlug;
  let counter = 1;

  while (await brandRepository.findBySlug(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export const brandService = {
  async getAll() {
    return brandRepository.findAll();
  },

  async create(data: {
    name: string;
    description?: string | null;
    logo_url?: string | null;
    country?: string | null;
    is_active?: 0 | 1;
  }) {
    const normalizedName = normalizePersianText(data.name);

    const existingName = await brandRepository.findByName(normalizedName);
    if (existingName) {
      throw new Error("برندی با این نام قبلاً ثبت شده است");
    }

    const slug = await generateUniqueSlug(normalizedName);

    const id = await brandRepository.create({
      name: normalizedName,
      slug,
      description: data.description ?? null,
      logo_url: data.logo_url ?? null,
      country: data.country ?? null,
      is_active: data.is_active ?? 1,
    });

    return brandRepository.findById(Number(id));
  },

  async update(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      logo_url?: string | null;
      country?: string | null;
      is_active?: 0 | 1;
    },
  ) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw new Error("برند موردنظر پیدا نشد");
    }

    const nextName = data.name
      ? normalizePersianText(data.name)
      : existing.name;

    if (data.name && nextName !== existing.name) {
      const duplicatedName = await brandRepository.findByName(nextName);
      if (duplicatedName && Number(duplicatedName.id) !== id) {
        throw new Error("برندی با این نام قبلاً ثبت شده است");
      }
    }

    let nextSlug = existing.slug;
    if (data.name && nextName !== existing.name) {
      const baseSlug = toSlug(nextName) || "brand";
      nextSlug = baseSlug;
      let counter = 1;

      while (true) {
        const duplicatedSlug = await brandRepository.findBySlug(nextSlug);
        if (!duplicatedSlug || Number(duplicatedSlug.id) === id) break;
        nextSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    await brandRepository.update(id, {
      name: nextName,
      slug: nextSlug,
      description:
        data.description !== undefined
          ? data.description
          : existing.description,
      logo_url: data.logo_url !== undefined ? data.logo_url : existing.logo_url,
      country: data.country !== undefined ? data.country : existing.country,
      is_active:
        data.is_active !== undefined ? data.is_active : existing.is_active,
    });

    return brandRepository.findById(id);
  },

  async delete(id: number) {
    const existing = await brandRepository.findById(id);
    if (!existing) {
      throw new Error("برند موردنظر پیدا نشد");
    }

    await brandRepository.softDelete(id);
    return true;
  },
};
