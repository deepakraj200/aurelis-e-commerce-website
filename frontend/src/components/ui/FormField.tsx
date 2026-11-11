import type { ReactNode } from 'react';

export const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1.5 text-[11px] text-red-300" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p className="mt-1.5 text-[11px] text-white/30">{hint}</p>
    ) : null}
  </div>
);
