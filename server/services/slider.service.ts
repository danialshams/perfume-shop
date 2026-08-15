import { sliderRepository } from "@/server/repositories/slider.repository";

type SliderPlacement = "HOME" | "PRODUCTS";

function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const sliderService = {
  async getAllForAdmin(placement?: SliderPlacement) {
    return sliderRepository.findAll(placement);
  },

  async getAllForUsers(placement?: SliderPlacement) {
    return sliderRepository.findActive(placement);
  },

  async getById(id: number) {
    return sliderRepository.findById(id);
  },

  async getUsedProductIdsByPlacement(
    placement: SliderPlacement,
    exceptSliderId?: number,
  ) {
    return sliderRepository.findUsedProductIdsByPlacement(
      placement,
      exceptSliderId,
    );
  },

  async createAuto({
    product,
    placement,
    is_active,
  }: {
    product: any;
    placement: SliderPlacement;
    is_active: boolean;
  }) {
    const title = product.name;
    const link = `/products/${product.id}`;
    const image_url = product.images?.[0]?.image_url;

    if (!image_url) {
      throw new Error("PRODUCT_HAS_NO_IMAGE");
    }

    const duplicate = await sliderRepository.findByProductIdAndPlacement(
      product.id,
      placement,
    );

    if (duplicate) {
      throw new Error("DUPLICATE_PRODUCT_PLACEMENT");
    }

    const cleanTitleSlug = generateSlug(title) || "slider";
    const baseSlug = `${cleanTitleSlug}-${product.id}`;

    let slug = baseSlug;
    let counter = 1;

    while (await sliderRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    return sliderRepository.create({
      product_id: product.id,
      placement,
      title,
      slug,
      image_url,
      link,
      is_active,
    });
  },

  async updateAuto(
    id: number,
    {
      product,
      placement,
      is_active,
    }: {
      product: any;
      placement: SliderPlacement;
      is_active: boolean;
    },
  ) {
    const title = product.name;
    const link = `/products/${product.id}`;
    const image_url = product.images?.[0]?.image_url;

    if (!image_url) {
      throw new Error("PRODUCT_HAS_NO_IMAGE");
    }

    const duplicate =
      await sliderRepository.findByProductIdAndPlacementExceptId(
        product.id,
        placement,
        id,
      );

    if (duplicate) {
      throw new Error("DUPLICATE_PRODUCT_PLACEMENT");
    }

    return sliderRepository.update(id, {
      product_id: product.id,
      placement,
      title,
      image_url,
      link,
      is_active,
    });
  },

  async delete(id: number) {
    return sliderRepository.softDelete(id);
  },

  async restore(id: number) {
    const restored = await sliderRepository.restore(id);

    if (!restored) return null;

    return sliderRepository.findById(id);
  },
};
