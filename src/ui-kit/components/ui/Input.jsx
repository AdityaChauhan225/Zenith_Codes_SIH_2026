import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 shadow-inner transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:outline-none focus-visible:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
