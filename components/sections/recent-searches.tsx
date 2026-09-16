"use client";

import { Clock, History } from "lucide-react";
import type { RecentSearch } from "@/lib/recent";

export function RecentSearches({
  recents,
  onPick,
  onClear,
}: {
  recents: RecentSearch[];
  onPick: (r: RecentSearch) => void;
  onClear: () => void;
}) {
  if (recents.length === 0) return null;
  return (
    <div className="mx-auto mt-5 max-w-3xl rounded-3xl border border-slate-950/10 bg-white/70 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white/80">
          <History size={14} aria-hidden /> Recent
        </p>
        <button
          onClick={onClear}
          className="t-tertiary cursor-pointer text-[11px] font-medium hover:text-slate-700 dark:hover:text-white/80"
        >
          Clear
        </button>
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {recents.map((r) => (
          <button
            key={`${r.lat},${r.lng},${r.at}`}
            onClick={() => onPick(r)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-slate-950/10 bg-white px-3 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-white/80"
          >
            <Clock size={12} aria-hidden /> {r.query} <span className="t-tertiary">· {r.label.split(",")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
