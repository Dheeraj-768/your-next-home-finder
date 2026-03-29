import { Star } from "lucide-react";

export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? "fill-warning text-warning"
              : "text-border"
          }`}
        />
      ))}
    </div>
  );
}

export function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-500"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-foreground w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}
