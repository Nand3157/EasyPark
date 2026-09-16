/** Crowd-reported occupancy — lives in localStorage, no backend required. */

export type CrowdLevel = "free" | "few" | "full";

export interface CrowdReport {
  spotId: number;
  level: CrowdLevel;
  at: number; // epoch ms
}

export const CROWD_KEY = "easypark:crowd";

export function levelLabel(level: CrowdLevel): string {
  if (level === "free") return "Free right now";
  if (level === "few") return "Few left";
  return "Full";
}

export function levelTone(level: CrowdLevel): string {
  if (level === "free") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (level === "few") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-red-500/15 text-red-600 dark:text-red-400";
}

export function formatRelTime(at: number, now = Date.now()): string {
  const diff = Math.max(0, now - at);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return "1 hour ago";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function isCrowdReport(v: unknown): v is CrowdReport {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.spotId === "number" &&
    (r.level === "free" || r.level === "few" || r.level === "full") &&
    typeof r.at === "number" &&
    Number.isFinite(r.at)
  );
}

export function isCrowdMap(v: unknown): v is Record<string, CrowdReport> {
  if (typeof v !== "object" || v === null) return false;
  return Object.values(v as Record<string, unknown>).every((item) => isCrowdReport(item));
}
