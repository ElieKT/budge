import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-brand-400 to-teal-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent"
          >
            💰 Budge
          </Link>
          <h1 className="mt-3 text-xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="card">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}
