"use client";

import { Loader2, MapPin, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILTERS, POPULAR_CITIES } from "@/lib/parking";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (query: string) => void;
  isSearching: boolean;
  searchError: string | null;
  currentLocationName: string;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

/** Hero + search unit: headline, destination search, city shortcuts, filters. */
export function HeroSearch({
  searchQuery,
  onSearchChange,
  onSearch,
  isSearching,
  searchError,
  currentLocationName,
  activeFilter,
  onSelectFilter,
}: HeroSearchProps) {
  return (
    <>
      <section aria-labelledby="hero-heading" className="flex flex-col items-center pt-10 pb-8 text-center md:pt-14">
        <Reveal>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/5 px-4 py-2 text-xs font-medium text-blue-700 md:text-sm dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            <Sparkles size={14} aria-hidden />
            Real nearby parking, live on the map
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h1
            id="hero-heading"
            className="mb-6 max-w-4xl text-4xl font-bold tracking-tight text-balance text-slate-950 sm:text-5xl md:text-7xl dark:text-white"
          >
            Find parking{" "}
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-700 bg-clip-text text-transparent dark:from-white dark:via-white/80 dark:to-white/40">
              before you arrive.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="t-secondary mx-auto mb-8 max-w-2xl text-base leading-relaxed md:text-xl">
            Discover nearby spaces, compare live availability, pricing, EV charging and
            accessibility — then navigate straight there.
          </p>
        </Reveal>
      </section>

      <section id="search" aria-label="Search parking" className="mb-14 scroll-mt-28">
        <Reveal delay={0.1}>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(searchQuery);
            }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-3xl border border-slate-950/10 bg-white/85 p-2.5 shadow-xl shadow-slate-950/5 backdrop-blur-xl sm:gap-3 sm:rounded-full dark:border-white/15 dark:bg-white/5 dark:shadow-black/40">
              <span className="t-tertiary flex items-center justify-center pl-3" aria-hidden>
                {isSearching ? (
                  <Loader2 size={22} className="animate-spin text-blue-500" />
                ) : (
                  <Search size={22} />
                )}
              </span>
              <label htmlFor="parking-search" className="sr-only">
                Search for parking near a destination
              </label>
              <input
                id="parking-search"
                type="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search destination, mall, airport, city…"
                className="min-w-0 flex-1 border-none bg-transparent py-3 pr-2 text-base text-slate-950 outline-none placeholder:text-slate-400 md:text-lg dark:text-white dark:placeholder:text-white/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="t-tertiary flex items-center justify-center rounded-full p-2 transition-colors hover:text-slate-950 dark:hover:text-white"
                >
                  <X size={18} aria-hidden />
                </button>
              )}
              <Button type="submit" disabled={isSearching} size="md" className="shrink-0">
                {isSearching ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden /> Searching…
                  </>
                ) : (
                  "Find Parking"
                )}
              </Button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="t-tertiary mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles size={12} className="text-blue-500" aria-hidden /> Popular:
            </span>
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => {
                  onSearchChange(city);
                  onSearch(city);
                }}
                className="cursor-pointer rounded-full border border-slate-950/10 bg-white/70 px-3 py-1 transition-all hover:border-blue-500 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/30 dark:hover:text-white"
              >
                {city}
              </button>
            ))}
          </div>
        </Reveal>

        {searchError && (
          <div role="alert" className="mx-auto mt-4 max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm font-medium text-red-600 dark:text-red-400">
            {searchError}
          </div>
        )}

        <p className="t-secondary mt-5 flex items-center justify-center gap-2 text-sm">
          <MapPin size={16} className="animate-pulse text-blue-500" aria-hidden />
          Active location:{" "}
          <strong className="font-semibold text-slate-950 dark:text-white">
            {currentLocationName}
          </strong>
        </p>

        <div className="mx-auto mt-8 max-w-5xl px-2 sm:px-4" role="group" aria-label="Filter parking spots">
          <div className="rounded-3xl border border-slate-950/10 bg-white/75 p-2 shadow-lg shadow-slate-950/5 backdrop-blur-xl sm:rounded-full dark:border-white/15 dark:bg-white/5 dark:shadow-black/30">
            <div className="hide-scrollbar flex w-full items-center gap-2 overflow-x-auto px-2 py-1 sm:gap-2.5 sm:px-4">
              {FILTERS.map((filter) => {
                const active = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => onSelectFilter(filter)}
                    aria-pressed={active}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 sm:px-5 sm:text-sm",
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 dark:bg-white dark:text-slate-950 dark:shadow-white/10"
                        : "t-secondary hover:bg-slate-950/5 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
