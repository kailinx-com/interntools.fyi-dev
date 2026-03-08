import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// builds clean Tailwind classnames string
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
