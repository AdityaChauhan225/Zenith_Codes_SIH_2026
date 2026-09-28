import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:     "bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 shadow-sm shadow-amber-500/20",
        primary:     "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/20",
        secondary:   "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700/60",
        destructive: "bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30",
        success:     "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30",
        warning:     "bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/30",
        outline:     "border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900 hover:text-neutral-100 text-neutral-300",
        ghost:       "hover:bg-neutral-800/80 hover:text-neutral-100 text-neutral-400",
        link:        "text-amber-400 underline-offset-4 hover:underline p-0 h-auto font-medium",
        neon:        "bg-[#145C8C] text-white font-bold hover:bg-[#0B3D5C] shadow-sm",
      },
      size: {
        default:  "h-9 px-4 py-2",
        sm:       "h-8 rounded-lg px-3 text-[11px]",
        lg:       "h-11 rounded-2xl px-6 text-sm",
        icon:     "h-9 w-9 rounded-xl",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
