import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const ucFirst = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
