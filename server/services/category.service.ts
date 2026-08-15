import { categoryRepository } from "@/server/repositories/category.repository";
import { toSlug } from "@/server/utils/slug";

type CreateCategoryInput = {
  name: string;
  parent_ids?: number[];
  description?: string | null;
  image_url?: string | null;
  is_active?: 0 | 1;
};

type UpdateCategoryInput = Partial<CreateCategoryInput>;

function normalizeParentIds(parentIds?: number[]) {
  if (!Array.isArray(parentIds)) return [];

  return [...new Set(parentIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
}

async function generateUniqueCategorySlug(name: string, excludeId?: number) {
  const baseSlug = toSlug(name.trim());

  if (!baseSlug) {
    throw new Error("امکان ساخت اسلاگ برای این نام وجود ندارد");
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await categoryRepository.findBySlugIncludingDeleted(slug);

    if (!existing) {
      return slug;
    }

    if (excludeId && Number(existing.id) === Number(excludeId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const categoryService = {
  async getAll() {
    return categoryRepository.findAll();
  },

  async getRoots() {
    return categoryRepository.findRoots();
  },

  async getChildrenByParentId(parentId: number) {
    if (!Number.isInteger(parentId) || parentId <= 0) {
      throw new Error("شناسه والد نامعتبر است");
    }

    return categoryRepository.findChildrenByParentId(parentId);
  },

  async getById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("شناسه دسته‌بندی نامعتبر است");
    }

    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new Error("دسته‌بندی پیدا نشد");
    }

    return category;
  },

  async create(data: CreateCategoryInput) {
    const name = data.name?.trim();

    if (!name) {
      throw new Error("نام دسته‌بندی الزامی است");
    }

    const parentIds = normalizeParentIds(data.parent_ids);

    if (parentIds.length > 0) {
      const invalidIds = await categoryRepository.findInvalidIds(parentIds);

      if (invalidIds.length > 0) {
        throw new Error("بعضی از دسته‌های والد انتخاب‌شده معتبر نیستند");
      }
    }

    const slug = await generateUniqueCategorySlug(name);

    const id = await categoryRepository.create({
      name,
      slug,
      description: data.description?.trim() || null,

      /**
       * در حالت جدید image_url دیگر توسط کاربر وارد نمی‌شود.
       * route تصویر را آپلود می‌کند و مسیر فایل را اینجا می‌فرستد.
       * مثال:
       * /uploads/categories/abc.webp
       */
      image_url: data.image_url?.trim() || null,

      is_active: data.is_active ?? 1,
    });

    if (parentIds.includes(id)) {
      await categoryRepository.softDelete(id);
      throw new Error("یک دسته‌بندی نمی‌تواند والد خودش باشد");
    }

    if (parentIds.length > 0) {
      const createsCycle = await categoryRepository.wouldCreateCycle(
        id,
        parentIds,
      );

      if (createsCycle) {
        await categoryRepository.softDelete(id);

        throw new Error(
          "ساختار والد/فرزند باعث ایجاد حلقه در دسته‌بندی‌ها می‌شود",
        );
      }
    }

    await categoryRepository.setParents(id, parentIds);

    const createdCategory = await categoryRepository.findById(id);

    if (!createdCategory) {
      throw new Error("خطا در دریافت دسته‌بندی ایجادشده");
    }

    return createdCategory;
  },

  async update(id: number, data: UpdateCategoryInput) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("شناسه دسته‌بندی نامعتبر است");
    }

    const existingCategory = await categoryRepository.findById(id);

    if (!existingCategory) {
      throw new Error("دسته‌بندی پیدا نشد");
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new Error("نام دسته‌بندی الزامی است");
    }

    let slug: string | undefined;

    if (data.name !== undefined) {
      slug = await generateUniqueCategorySlug(data.name.trim(), id);
    }

    if (data.parent_ids !== undefined) {
      const normalizedParentIds = normalizeParentIds(data.parent_ids);

      if (normalizedParentIds.includes(id)) {
        throw new Error("یک دسته‌بندی نمی‌تواند والد خودش باشد");
      }

      const invalidIds =
        await categoryRepository.findInvalidIds(normalizedParentIds);

      if (invalidIds.length > 0) {
        throw new Error("بعضی از دسته‌های والد انتخاب‌شده معتبر نیستند");
      }

      const createsCycle = await categoryRepository.wouldCreateCycle(
        id,
        normalizedParentIds,
      );

      if (createsCycle) {
        throw new Error(
          "ساختار والد/فرزند باعث ایجاد حلقه در دسته‌بندی‌ها می‌شود",
        );
      }

      await categoryRepository.setParents(id, normalizedParentIds);
    }

    await categoryRepository.update(id, {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),

      /**
       * اگر image_url مقدار string داشته باشد، تصویر جدید ذخیره می‌شود.
       * اگر null باشد، تصویر دسته‌بندی حذف می‌شود.
       * اگر undefined باشد، تغییری در تصویر ایجاد نمی‌شود.
       */
      ...(data.image_url !== undefined
        ? { image_url: data.image_url?.trim() || null }
        : {}),

      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    });

    const updatedCategory = await categoryRepository.findById(id);

    if (!updatedCategory) {
      throw new Error("خطا در دریافت دسته‌بندی بروزشده");
    }

    return updatedCategory;
  },

  async remove(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("شناسه دسته‌بندی نامعتبر است");
    }

    const existingCategory = await categoryRepository.findById(id);

    if (!existingCategory) {
      throw new Error("دسته‌بندی پیدا نشد");
    }

    await categoryRepository.removeRelations(id);
    await categoryRepository.softDelete(id);

    return { success: true };
  },
};
