"use client";

import { AlarmClock, Plus, Square } from "lucide-react";
import { directionsUrl } from "@/lib/maps";
import { formatRemaining } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { ParkingSessionControls } from "@/hooks/use-parking-session";

/** Fixed bottom banner for the active parking session: countdown + actions. */
export function SessionBanner({ session, remainingMs, extendSession, endSession }: ParkingSessionControls) {
  if (!session) return null;
  const expired = remainingMs <= 0;
  const warning = !expired && remainingMs <= 15 * 60 * 1000;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-4 bottom-4 z-[500] mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-3xl border p-4 shadow-2xl backdrop-blur-xl",
        expired
          ? "border-red-500/40 bg-red-950/90 text-white"
          : warning
            ? "border-amber-500/40 bg-amber-950/90 text-white"
            : "border-slate-950/10 bg-white/95 text-slate-950 dark:border-white/15 dark:bg-slate-950/90 dark:text-white"
      )}
    >
      <span className={cn(
        "flex size-10 items-center justify-center rounded-2xl",
        expired ? "bg-red-500/20 text-red-300" : warning ? "bg-amber-500/20 text-amber-300" : "bg-blue-600/10 text-blue-600 dark:text-blue-400"
      )}>
        <AlarmClock size={20} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{session.spotName}</p>
        <p className={cn(
          "text-xs font-semibold",
          expired ? "text-red-300" : warning ? "text-amber-300" : "t-secondary"
        )}>
          {expired ? "Session expired — move your car or extend." : formatRemaining(remainingMs)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => extendSession(15)}
          className="flex cursor-pointer items-center gap-1 rounded-xl border border-current px-3 py-2 text-xs font-bold opacity-80 transition-opacity hover:opacity-100"
        >
          <Plus size={14} aria-hidden /> 15m
        </button>
        <a
          href={directionsUrl(session.lat, session.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
        >
          Walk back
        </a>
        <button
          onClick={endSession}
          aria-label="End parking session"
          className="flex cursor-pointer items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-white/20"
        >
          <Square size={12} aria-hidden /> End
        </button>
      </div>
    </div>
  );
}
