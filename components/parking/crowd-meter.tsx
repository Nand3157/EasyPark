"use client";

import { cn } from "@/lib/utils";
import { formatRelTime, levelLabel, levelTone, type CrowdLevel, type CrowdReport } from "@/lib/crowd";

const LEVELS: { level: CrowdLevel; label: string }[] = [
  { level: "free", label: "Free" },
  { level: "few", label: "Few" },
  { level: "full", label: "Full" },
];

export function CrowdMeter({
  report,
  now,
  onReport,
}: {
  report?: CrowdReport;
  now: number;
  onReport: (level: CrowdLevel) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-950/8 bg-slate-950/[0.03] p-3 dark:border-white/8 dark:bg-white/5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="t-tertiary text-[10px] font-bold tracking-wider uppercase">Crowd report</p>
        {report ? (
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", levelTone(report.level))}>
            {levelLabel(report.level)} · {formatRelTime(report.at, now)}
          </span>
        ) : (
          <span className="t-tertiary text-[11px]">No reports yet</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => onReport(level)}
            aria-pressed={report?.level === level}
            className={cn(
              "cursor-pointer rounded-xl border px-2 py-2 text-xs font-semibold transition-colors",
              report?.level === level
                ? levelTone(level) + " border-current"
                : "border-slate-950/10 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="t-tertiary mt-2 text-[10px]">Stored locally. Helps the next driver — no login needed.</p>
    </div>
  );
}
