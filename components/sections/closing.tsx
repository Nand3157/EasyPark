"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/motion/reveal";
import { scrollToSection } from "@/lib/utils";

const STATS = [
  { label: "Parking locations", value: "10,000+" },
  { label: "Drivers served", value: "500K+" },
  { label: "Satisfaction", value: "98%" },
  { label: "Availability", value: "24/7" },
];

/** Proof stats + closing call to action. */
export function Closing() {
  return (
    <>
      <section aria-label="EasyPark in numbers" className="mb-20 md:mb-24">
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.07} className="text-center">
              <div>
                <dd className="mb-2 bg-gradient-to-b from-blue-700 to-indigo-900 bg-clip-text text-4xl font-bold text-transparent md:text-5xl dark:from-white dark:to-white/40">
                  {stat.value}
                </dd>
                <dt className="t-tertiary text-xs tracking-[0.2em] uppercase md:text-sm">
                  {stat.label}
                </dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <section aria-label="Get started" className="mb-20 md:mb-24">
        <Reveal>
          <Card hover={false} className="px-6 py-14 text-center md:p-20">
            <SectionHeader
              title="Never circle the block again."
              lede="Start using EasyPark today and reach your destination stress-free."
              className="mb-9 md:mb-10"
            />
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" onClick={() => scrollToSection("search")}>
                Find parking
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("features")}>
                Learn more
              </Button>
            </div>
          </Card>
        </Reveal>
      </section>
    </>
  );
}
