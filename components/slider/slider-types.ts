export type SliderPlacement = "HOME" | "PRODUCTS";

export interface SliderProductOption {
  id: number;
  name: string;
  slug?: string | null;
  brand_name?: string | null;
  main_image?: string | null;
  min_price?: number | null;
  status?: string | null;
  is_active?: boolean | number | null;
}

export interface SliderItem {
  id: number;
  product_id: number | null;
  placement: SliderPlacement;

  title?: string;
  slug?: string;
  image_url?: string | null;
  link?: string | null;

  is_active: boolean | number;

  product_name?: string | null;
  product_slug?: string | null;
  product_status?: string | null;
  product_is_active?: boolean | number | null;
  product_main_image?: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SliderFormValues {
  product_id: number;
  placement: SliderPlacement;
  is_active: boolean;
}
