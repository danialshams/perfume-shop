function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") return undefined;

  return value;
}

function getNumber01(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (value === undefined || value === "") return undefined;

  const numberValue = Number(value);

  if (numberValue === 0 || numberValue === 1) {
    return numberValue;
  }

  return undefined;
}

function parseParentIds(formData: FormData) {
  const values = [
    ...formData.getAll("parent_ids"),
    ...formData.getAll("parent_ids[]"),
  ].filter((value): value is string => typeof value === "string");

  if (!values.length) return undefined;

  /**
   * حالت‌های قابل قبول:
   *
   * parent_ids: [1,2,3] به صورت JSON
   * parent_ids: 1,2,3
   * parent_ids[]: 1
   * parent_ids[]: 2
   */
  if (values.length === 1) {
    const singleValue = values[0].trim();

    if (!singleValue) return [];

    try {
      const parsed = JSON.parse(singleValue);

      if (Array.isArray(parsed)) {
        return parsed.map(Number);
      }
    } catch {
      /**
       * اگر JSON نبود، پایین با comma جدا می‌کنیم.
       */
    }

    return singleValue
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  return values
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function getCategoryImageFile(formData: FormData) {
  const image = formData.get("image");

  if (image instanceof File && image.size > 0) {
    return image;
  }

  return null;
}

export function shouldRemoveCategoryImage(formData: FormData) {
  const value = getString(formData, "remove_image");

  return ["1", "true", "on", "yes"].includes(String(value).toLowerCase());
}

export function categoryPayloadFromFormData(
  formData: FormData,
  imageUrl?: string | null,
) {
  const payload: Record<string, unknown> = {};

  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const parentIds = parseParentIds(formData);
  const isActive = getNumber01(formData, "is_active");

  if (name !== undefined) {
    payload.name = name;
  }

  if (description !== undefined) {
    payload.description = description;
  }

  if (parentIds !== undefined) {
    payload.parent_ids = parentIds;
  }

  if (isActive !== undefined) {
    payload.is_active = isActive;
  }

  if (imageUrl !== undefined) {
    payload.image_url = imageUrl;
  }

  return payload;
}
