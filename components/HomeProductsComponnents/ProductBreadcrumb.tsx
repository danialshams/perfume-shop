import { Product, getCategoryParts } from "@/lib/product";

type Props = {
  product: Product;
};

export default function ProductBreadcrumb({ product }: Props) {
  const parts = getCategoryParts(product);

  return (
    <nav
      aria-label="breadcrumb"
      className="pd-reveal mx-auto flex max-w-7xl items-center justify-center lg:justify-start"
    >
      <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#dbe5f2] bg-white/80 px-4 py-2 text-[11px] text-[#5f7696] shadow-[0_8px_24px_rgba(15,31,61,0.05)] backdrop-blur-xl sm:text-[12px] lg:justify-start">
        <span className="font-medium text-[#7b8faa]">خانه</span>

        {parts.map((part, index) => (
          <span key={`${part}-${index}`} className="inline-flex items-center gap-2">
            <span className="text-[#9aaabd]">/</span>
            <span
              className={
                index === parts.length - 1
                  ? "font-semibold text-[#10213f]"
                  : "font-medium text-[#5f7696]"
              }
            >
              {part}
            </span>
          </span>
        ))}

        <span className="inline-flex items-center gap-2">
          <span className="text-[#9aaabd]">/</span>
          <span className="font-semibold text-[#10213f]">{product.name}</span>
        </span>
      </div>
    </nav>
  );
}
