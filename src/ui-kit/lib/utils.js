/**
 * cn() utility — merges Tailwind class strings with clsx + tailwind-merge.
 * Dependencies: clsx, tailwind-merge
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
