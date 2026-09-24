import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border",
  {
    variants: {
      variant: {
        default:     "border-neutral-700 bg-neutral-800 text-neutral-200",
        secondary:   "border-neutral-800 bg-neutral-900 text-neutral-400",
        destructive: "border-red-500/30 bg-red-500/15 text-red-400",
        outline:     "border-neutral-700 text-neutral-300",
        available:   "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        occupied:    "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
        maintenance: "border-amber-500/30 bg-amber-500/15 text-amber-300",
        inactive:    "border-neutral-700 bg-neutral-800/80 text-neutral-400",
        critical:    "border-red-500/40 bg-red-500/20 text-red-400 animate-pulse",
        resolved:    "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        info:        "border-blue-500/30 bg-blue-500/15 text-blue-300",
        neon:        "border-[#145C8C]/30 bg-[#145C8C]/15 text-[#145C8C]",

        // ── IMD/NDMA Severity Scale ──
        // Green  → Normal / No risk
        "severity-green":  "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        // Yellow → Advisory / Be watchful
        "severity-yellow": "border-yellow-500/30 bg-yellow-500/15 text-yellow-400",
        // Orange → Watch / Prepare to act
        "severity-orange": "border-orange-500/30 bg-orange-500/15 text-orange-400",
        // Red    → Warning / Immediate action
        "severity-red":    "border-red-500/40 bg-red-500/20 text-red-400 animate-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, dot = true, children, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "available" || variant === "resolved" || variant === "severity-green" ? "bg-emerald-400"
            : variant === "occupied"    ? "bg-cyan-400"
            : variant === "maintenance" || variant === "severity-yellow" ? "bg-yellow-400"
            : variant === "severity-orange" ? "bg-orange-400"
            : variant === "critical" || variant === "destructive" || variant === "severity-red" ? "bg-red-400"
            : variant === "info"  ? "bg-blue-400"
            : variant === "neon"  ? "bg-[#145C8C]"
            : "bg-neutral-400"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
