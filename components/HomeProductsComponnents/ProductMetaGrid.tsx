import { Product } from "@/lib/product";

type Props = {
  product: Product;
};

export default function ProductMetaGrid({ product }: Props) {
  const items = [

    {
      label: "خانواده بویایی",
      value: typeof product.scent_family === "string" ? product.scent_family : (product.scent_family?.name || "—"),
    },
    {
      label: "دسته‌بندی",
      value: product.category_name || "—",
    },
    {
      label: "تعداد واریانت",
      value: String(product.variant_count ?? 0),
    },
    {
      label: "موجودی کل",
      value: String(product.total_stock ?? 0),
    },
  ];

  return (
    <section className="border border-[#e0d8cc] bg-[#f9f6f0] p-5 sm:p-6 lg:p-7">
      <div className="mb-5 text-center lg:text-right">
        <p className="text-[11px] tracking-[0.2em] text-[#937f68]">PRODUCT FACTS</p>
        <h2 className="mt-2 text-[24px] font-semibold text-[#302d29] sm:text-[28px]">
          مشخصات محصول
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-b border-[#e2d9ce] bg-transparent px-4 py-4 text-center lg:text-right"
          >
            <p className="text-[11px] tracking-[0.18em] text-[#937f68]">
              {item.label}
            </p>
            <p className="mt-2 text-[15px] font-medium text-[#302d29] sm:text-[16px]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
