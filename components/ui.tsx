import type { ButtonHTMLAttributes, ReactNode } from "react";

export function BrandMark() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-800 text-white shadow-sm">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <path
          d="M6 14v4M11 10v12M16 7v18M21 11v10M26 14v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

const buttonStyles = {
  primary:
    "bg-teal-800 text-white hover:bg-teal-900 disabled:bg-stone-300 disabled:text-stone-500",
  coral: "bg-orange-600 text-white hover:bg-orange-700",
  ghost: "bg-white text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50",
} as const;

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
      {message}
    </p>
  );
}
