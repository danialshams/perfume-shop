import type {
  CategoriesResponse,
  Category,
  CreateProductPayload,
  Product,
  ProductDetailsResponse,
  UploadImageResult,
  UploadVoiceResult,
} from "./product";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

function createApiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return typeof window === "undefined" && API_BASE_URL
    ? `${API_BASE_URL}${cleanPath}`
    : cleanPath;
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.message || json?.error || "درخواست با خطا مواجه شد";
    throw new Error(message);
  }

  return json as T;
}

export async function getProductById(id: string): Promise<Product | null> {
  const res = await fetch(createApiUrl(`/api/v1/products/${id}`), {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  const json = await parseJsonResponse<ProductDetailsResponse>(res);
  return json.data ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(createApiUrl("/api/v1/categories"), {
    method: "GET",
    cache: "no-store",
  });

  const json = await parseJsonResponse<CategoriesResponse>(res);
  return json.data ?? [];
}

export async function createProduct(payload: CreateProductPayload) {
  const res = await fetch(createApiUrl("/api/v1/products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  return parseJsonResponse<{
    success: boolean;
    message: string;
    data: Product;
  }>(res);
}

export async function uploadProductImage(
  file: File,
): Promise<UploadImageResult> {
  const actualFile = (file as any).originFileObj || file;

  const formData = new FormData();
  formData.append("file", actualFile);

  const res = await fetch(createApiUrl("/api/v1/uploads/products"), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await parseJsonResponse<{
    success: boolean;
    message: string;
    data: UploadImageResult;
  }>(res);

  return json.data;
}

export async function uploadProductVoice(
  file: File,
): Promise<UploadVoiceResult> {
  const actualFile = (file as any).originFileObj || file;

  const formData = new FormData();
  formData.append("file", actualFile);

  const res = await fetch(createApiUrl("/api/v1/uploads/products/voice"), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await parseJsonResponse<{
    success: boolean;
    message: string;
    data: UploadVoiceResult;
  }>(res);

  return json.data;
}
