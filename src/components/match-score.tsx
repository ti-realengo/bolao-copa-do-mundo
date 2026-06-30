import type { Match } from "@/lib/db/schema";

interface Props {
  match: Match;
  variant?: "block" | "inline";
  className?: string;
}

export function PenaltiesBadge({ match, variant = "inline", className = "" }: Props) {
  if (match.homeScorePen == null || match.awayScorePen == null) return null;

  const label = `Pên: ${match.homeScorePen} x ${match.awayScorePen}`;

  if (variant === "block") {
    return (
      <div className={`text-xs text-center text-brand-text-muted ${className}`}>
        Pênaltis: {match.homeScorePen} x {match.awayScorePen}
      </div>
    );
  }

  return (
    <span className={`text-xs text-brand-text-muted ${className}`}>
      ({label})
    </span>
  );
}

export function ExtraTimeBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xs text-brand-text-muted italic ${className}`}>
      Após prorrogação
    </span>
  );
}