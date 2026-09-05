import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/motion/reveal";

const STEPS = [
  { step: "01", title: "Search destination", desc: "Enter where you're headed — or use your live location." },
  { step: "02", title: "Compare nearby", desc: "Weigh price, walk time and live availability at a glance." },
  { step: "03", title: "Reserve your spot", desc: "Lock it in so it's waiting when you arrive." },
  { step: "04", title: "Navigate & park", desc: "Follow directions straight to the entrance." },
];

/** Four-step timeline. */
export function Process() {
  return (
    <section aria-label="How it works" className="mb-20 md:mb-28">
      <SectionHeader eyebrow="How it works" title="Parked in four steps" />
      <ol className="relative grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div
          aria-hidden
          className="absolute top-6 right-0 left-0 hidden h-px bg-slate-950/10 lg:block dark:bg-white/10"
        />
        {STEPS.map((item, i) => (
          <Reveal key={item.step} delay={i * 0.1}>
            <li className="relative text-center lg:text-left">
              <p
                aria-hidden
                className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 lg:mx-0 dark:bg-white dark:text-slate-950 dark:shadow-white/10"
              >
                {item.step}
              </p>
              <h3 className="mb-2 text-lg font-bold text-slate-950 dark:text-white">{item.title}</h3>
              <p className="t-secondary text-sm leading-relaxed">{item.desc}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
