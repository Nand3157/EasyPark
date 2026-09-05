"use client";

import { AtSign, Camera, MapPin, Music2, Play, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { scrollToSection } from "@/lib/utils";

interface SiteFooterProps {
  onSelectFilter: (filter: string) => void;
}

const SOCIALS = [
  { Icon: Music2, label: "EasyPark on TikTok", href: "https://www.tiktok.com/" },
  { Icon: AtSign, label: "EasyPark on X", href: "https://x.com/" },
  { Icon: Play, label: "EasyPark on YouTube", href: "https://www.youtube.com/" },
  { Icon: Camera, label: "EasyPark on Instagram", href: "https://www.instagram.com/" },
  { Icon: Send, label: "EasyPark on Telegram", href: "https://telegram.org/" },
];

/** Footer: brand statement, working explore shortcuts, plain company lists, socials. */
export function SiteFooter({ onSelectFilter }: SiteFooterProps) {
  const explore: { label: string; action: () => void }[] = [
    { label: "Find Parking", action: () => scrollToSection("search") },
    { label: "Live Availability", action: () => onSelectFilter("Open Now") },
    { label: "EV Charging", action: () => onSelectFilter("EV Charging") },
    { label: "Covered Parking", action: () => onSelectFilter("Covered Parking") },
    { label: "Smart Navigation", action: () => scrollToSection("map") },
  ];

  return (
    <footer className="w-full pb-12">
      <Card hover={false} className="p-8 md:p-12">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 shadow-lg shadow-blue-600/25">
                <MapPin className="text-white" size={20} aria-hidden />
              </span>
              <span className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                EasyPark
              </span>
            </div>
            <p className="t-secondary max-w-sm text-sm leading-relaxed">
              EasyPark makes city parking effortless — discover nearby spaces, compare live
              availability and pricing, and navigate with confidence from one place.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-950 uppercase dark:text-white">
                Explore
              </h3>
              <ul className="t-secondary space-y-2.5 text-sm">
                {explore.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-950 uppercase dark:text-white">
                Company
              </h3>
              <ul className="t-tertiary space-y-2.5 text-sm">
                <li>About</li>
                <li>Careers</li>
                <li>Partners</li>
                <li>Newsroom</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-950 uppercase dark:text-white">
                Support
              </h3>
              <ul className="t-tertiary space-y-2.5 text-sm">
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Report Issue</li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-950/10 pt-6 md:flex-row dark:border-white/10">
          <p className="t-tertiary text-[11px] tracking-[0.2em] uppercase">
            Powered by EasyPark © 2026
          </p>
          <div className="flex items-center gap-5">
            <span className="t-tertiary text-[11px] tracking-[0.2em] uppercase">Follow us</span>
            <div className="flex gap-4">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="t-secondary transition-all hover:-translate-y-0.5 hover:text-blue-600 dark:hover:text-white"
                >
                  <Icon size={18} aria-hidden />
                </a>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </footer>
  );
}
