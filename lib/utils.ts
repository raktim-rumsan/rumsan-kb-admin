import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/);
  return match ? match[1] : null;
}

export default function truncateMiddleUrl(
  url: string,
  maxStart = 12,
  maxEnd = 8
) {
  if (url.length <= maxStart + maxEnd + 3) return url; // short enough, no truncation
  const start = url.slice(0, maxStart);
  const end = url.slice(-maxEnd);
  return `${start}...${end}`;
}
