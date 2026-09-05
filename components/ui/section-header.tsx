import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "center" | "left";
  className?: string;
}

/** Editorial section heading: eyebrow → title → lede. One pattern everywhere. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "mb-12 max-w-2xl md:mb-16",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-blue-600 uppercase dark:text-blue-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-balance text-slate-950 md:text-5xl dark:text-white">
        {title}
      </h2>
      {lede && <p className="t-secondary mt-4 text-base leading-relaxed md:text-lg">{lede}</p>}
    </Reveal>
  );
}
