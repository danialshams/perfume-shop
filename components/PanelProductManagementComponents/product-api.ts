import { CreateProductPayload } from "@/lib/product";

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    console.error("Non-JSON response:", text);
    throw new Error(
      text?.startsWith("<!DOCTYPE") || text?.startsWith("<html")
        ? "پاسخ سرور JSON نیست. احتمالاً route اشتباه است یا redirect رخ داده."
        : "پاسخ سرور قابل پردازش نیست.",
    );
  }
}

export async function getProducts(params?: any) {
  const searchParams = new URLSearchParams();

  const appendIfFilled = (key: string, value: any) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  };

  const appendFlag = (key: string, value: any) => {
    if (value === undefined || value === null || value === "") return;

    if (value === true || value === "true" || value === 1 || value === "1") {
      searchParams.set(key, "1");
      return;
    }

    if (value === false || value === "false" || value === 0 || value === "0") {
      searchParams.set(key, "0");
      return;
    }
  };

  appendIfFilled("page", params?.page);
  appendIfFilled("limit", params?.limit);
  appendIfFilled("search", params?.search);
  appendIfFilled("status", params?.status);
  appendIfFilled("categoryId", params?.categoryId);
  appendIfFilled("categorySlug", params?.categorySlug);
  appendIfFilled("type", params?.type);
  appendIfFilled("minPrice", params?.minPrice);
  appendIfFilled("maxPrice", params?.maxPrice);
  appendIfFilled("sort", params?.sort);

  appendFlag("is_active", params?.is_active);
  appendFlag("is_featured", params?.is_featured);
  appendFlag("is_best_seller", params?.is_best_seller);

  if (
    params?.inStock !== undefined &&
    params?.inStock !== null &&
    params?.inStock !== ""
  ) {
    searchParams.set("inStock", String(params.inStock));
  }

  const query = searchParams.toString();
  const url = `/api/v1/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();

    console.error("GET PRODUCTS FAILED");
    console.error("Status:", res.status);
    console.error("URL:", url);
    console.error("Body:", errorText);

    throw new Error("Failed to fetch products");
  }

  const json = await res.json();
  return json.data;
}

export async function createProduct(payload: CreateProductPayload) {
  const response = await fetch("/api/v1/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      result?.message || result?.error || "ایجاد محصول با خطا مواجه شد",
    );
  }

  return result;
}

export async function getProductById(id: number | string) {
  const response = await fetch(`/api/v1/products/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(result?.message || "خطا در دریافت اطلاعات محصول");
  }

  return result.data;
}

export async function updateProduct(
  id: number | string,
  payload: Record<string, any>,
) {
  const response = await fetch(`/api/v1/products/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(result?.message || "خطا در ویرایش محصول");
  }

  return result.data;
}
export async function getScentFamilies() {
  const response = await fetch("/api/v1/scent-families", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const result = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        "دریافت گروه‌های بویایی با خطا مواجه شد",
    );
  }

  return result;
}
