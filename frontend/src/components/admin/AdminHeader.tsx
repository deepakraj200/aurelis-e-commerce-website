import type { ReactNode } from 'react';

export const AdminHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-5 border-b border-white/[0.06] pb-7 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
      <h1 className="text-[28px] leading-tight tracking-[-0.04em] text-pearl sm:text-[34px]">{title}</h1>
      {description && <p className="mt-2 max-w-xl text-[11.5px] leading-relaxed text-white/35">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
