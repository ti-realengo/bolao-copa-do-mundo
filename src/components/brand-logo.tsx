import Link from "next/link";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  href?: string;
  logoUrl?: string | null;
  companyName?: string | null;
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({
  href = "/",
  logoUrl,
  companyName,
  size = "md",
  showText = true,
  className,
}: Props) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconDim = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const textCls = size === "sm" ? "text-base" : "text-lg";

  const mark = logoUrl ? (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden bg-brand-card border border-brand-border",
        dim,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={companyName ?? "Logo"} className="h-full w-full object-contain p-1" />
    </span>
  ) : (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/60 shadow-[0_4px_16px_-4px_hsl(var(--brand-primary)/0.6)]",
        dim,
      )}
    >
      <Trophy className={cn("text-white", iconDim)} strokeWidth={2.5} />
    </span>
  );

  const label = companyName ? (
    <span className={cn("font-display font-bold leading-none", textCls)}>{companyName}</span>
  ) : (
    <span className={cn("font-display font-bold leading-none", textCls)}>
      Bolão <span className="text-brand-primary">2026</span>
    </span>
  );

  const inner = (
    <>
      {mark}
      {showText && label}
    </>
  );

  if (!href) {
    return <div className={cn("flex items-center gap-2.5", className)}>{inner}</div>;
  }

  return (
    <Link href={href} className={cn("flex items-center gap-2.5 shrink-0", className)}>
      {inner}
    </Link>
  );
}
