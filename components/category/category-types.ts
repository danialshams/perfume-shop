export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  parent_ids: number[];
  parent_names: string[];
  parents_count?: number;
  children_count: number;
  description?: string | null;
  image_url?: string | null;
  is_active: number | boolean;
  has_children: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryFormValues = {
  name?: string;
  parent_ids?: number[];
  description?: string;

  image_url?: string | null;

  image_file?: File | null;

  remove_image?: boolean;

  is_active?: 0 | 1;
};
