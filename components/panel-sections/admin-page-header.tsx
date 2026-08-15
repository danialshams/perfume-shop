"use client";

import { ReactNode } from "react";

export default function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="text-xl font-black text-neutral-900 md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
