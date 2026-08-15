import { Product } from "@/lib/product";

type Props = {
  product: Product;
};

export default function ProductMetaGrid({ product }: Props) {
  const items = [

    {
      label: "خانواده بویایی",
      value: product.scent_family || "—",
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
    <section className="rounded-[30px] border border-[#dbe5f2] bg-white/85 p-5 shadow-[0_18px_44px_rgba(15,31,61,0.06)] backdrop-blur-xl sm:p-6 lg:p-7">
      <div className="mb-5 text-center lg:text-right">
        <p className="text-[11px] tracking-[0.2em] text-[#6a83a3]">PRODUCT FACTS</p>
        <h2 className="mt-2 text-[24px] font-semibold text-[#112447] sm:text-[28px]">
          مشخصات محصول
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[22px] border border-[#e8eef6] bg-[#fbfdff] px-4 py-4 text-center lg:text-right"
          >
            <p className="text-[11px] tracking-[0.18em] text-[#6a83a3]">
              {item.label}
            </p>
            <p className="mt-2 text-[15px] font-medium text-[#10213f] sm:text-[16px]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
