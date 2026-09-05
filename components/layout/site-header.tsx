"use client";

import { MapPin, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/utils";

interface SiteHeaderProps {
  isLight: boolean;
  onToggleTheme: () => void;
}

const NAV_LINKS = [
  { label: "Search", target: "search" },
  { label: "Live Map", target: "map" },
  { label: "Nearby Spots", target: "spots" },
  { label: "Why EasyPark", target: "features" },
];

/** Sticky floating nav: brand, section links, theme toggle, primary CTA. */
export function SiteHeader({ isLight, onToggleTheme }: SiteHeaderProps) {
  return (
    <header className="sticky top-3 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10">
      <nav
        aria-label="Primary"
        className="flex items-center justify-between gap-3 rounded-full border border-slate-950/10 bg-white/75 py-3 pr-3 pl-5 shadow-lg shadow-slate-950/5 backdrop-blur-xl md:px-6 dark:border-white/10 dark:bg-slate-950/60 dark:shadow-black/40"
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5"
          aria-label="EasyPark home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 shadow-lg shadow-blue-600/25">
            <MapPin className="text-white" size={20} aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
            EasyPark{" "}
            <span className="rounded-full border border-blue-600/20 bg-blue-600/10 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wider text-blue-700 uppercase dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300">
              Smart
            </span>
          </span>
        </a>

        <ul className="t-tertiary hidden items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.target}>
              <button
                onClick={() => scrollToSection(link.target)}
                className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleTheme}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            className="rounded-full"
          >
            {isLight ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
          </Button>
          <Button size="sm" className="md:hidden" onClick={() => scrollToSection("search")}>
            Park
          </Button>
          <Button size="md" className="hidden md:inline-flex" onClick={() => scrollToSection("search")}>
            Find Parking
          </Button>
        </div>
      </nav>
    </header>
  );
}
