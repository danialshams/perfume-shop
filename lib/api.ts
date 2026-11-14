import type {
  CategoriesResponse,
  Category,
  CreateProductPayload,
  Product,
  ProductDetailsResponse,
  UploadImageResult,
  UploadVoiceResult,
} from "./product";
import {uploadAdminFile} from "./admin-upload-client";

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
    const issues = Array.isArray(json?.errors?.issues) ? json.errors.issues : [];
    const names: Record<string,string> = {
      name:"نام عطر",slug:"شناسه آدرس",category_links:"دسته‌بندی",
      scent_family_id:"گروه بویایی",new_scent_family:"گروه بویایی جدید",
      images:"تصاویر محصول",variants:"قیمت و موجودی",volume_ml:"حجم عطر",
      price:"قیمت",stock_qty:"موجودی",voice_file:"فایل صوتی",discount_price:"قیمت تخفیف",
    };
    const fields = issues.slice(0,3).map((issue:{path:(string|number)[];message:string})=>{
      const key=issue.path.map(String).find(part=>names[part])||"";
      return (names[key]||"اطلاعات محصول")+": "+issue.message;
    });
    const message = fields.length ? fields.join(" | ") :
      json?.message || json?.error || "درخواست با خطا مواجه شد";
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

export async function uploadProductImage(file:File):Promise<UploadImageResult>{
 const actual=(file as File&{originFileObj?:File}).originFileObj||file;
 return uploadAdminFile(actual,"image");
}
export async function uploadProductVoice(file:File):Promise<UploadVoiceResult>{
 const actual=(file as File&{originFileObj?:File}).originFileObj||file;
 return uploadAdminFile(actual,"voice");
}
