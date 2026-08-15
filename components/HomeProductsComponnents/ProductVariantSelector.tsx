"use client";

import CustomVariantSelect from "./CustomVariantSelect";

export type VariantSelectOption = {
  id: number;
  price: string;
  rawPrice: number | null;
  size: string;
  volumeMl: number | string | null;
  label: string;
};

export default function ProductVariantSelector({
  variants,
  selectedId,
  onChange,
}: {
  variants: VariantSelectOption[];
  selectedId: number;
  onChange: (id: number) => void;
}) {
  return (
    <div
      className="rounded-[20px] border border-[#dde8f4] bg-white p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <label className="mb-2 block text-[10px] font-semibold tracking-[0.18em] text-[#7b91af]">
        انتخاب واریانت
      </label>

      <CustomVariantSelect
        variants={variants}
        selectedId={selectedId}
        onChange={onChange}
      />
    </div>
  );
}
