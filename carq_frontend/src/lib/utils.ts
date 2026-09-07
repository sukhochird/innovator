import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "MOVING":
      return "text-emerald-400";
    case "IDLE":
      return "text-amber-400";
    case "STOPPED":
      return "text-zinc-400";
    case "ALERT":
      return "text-red-400";
    case "OFFLINE":
      return "text-zinc-500";
    default:
      return "text-blue-400";
  }
}
