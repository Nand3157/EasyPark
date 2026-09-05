import { Clock, Navigation, ShieldCheck, Zap } from "lucide-react";
import { Card, CardIcon } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/motion/reveal";

const FEATURES = [
  {
    Icon: Clock,
    title: "Real-time availability",
    desc: "See live open-spot counts before you leave, not after three laps of the block.",
  },
  {
    Icon: Zap,
    title: "Smart picks",
    desc: "Compare price, distance and walk time side by side to find your best option fast.",
  },
  {
    Icon: ShieldCheck,
    title: "Verified locations",
    desc: "Listings carry safety, lighting and access details so you can park with confidence.",
  },
  {
    Icon: Navigation,
    title: "One-tap navigation",
    desc: "Hand off to Google Maps for turn-by-turn guidance straight to the entrance.",
  },
];

/** Value-proposition grid. */
export function Features() {
  return (
    <section id="features" aria-label="Why EasyPark" className="mb-20 scroll-mt-28 md:mb-28">
      <SectionHeader
        eyebrow="Why EasyPark"
        title="Parking, minus the circling"
        lede="Everything you need to decide in seconds — availability, price and the way there."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {FEATURES.map(({ Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.08} className="h-full">
            <Card className="flex h-full flex-col gap-4 p-7">
              <CardIcon>
                <Icon size={24} aria-hidden />
              </CardIcon>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h3>
              <p className="t-secondary text-sm leading-relaxed">{desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
