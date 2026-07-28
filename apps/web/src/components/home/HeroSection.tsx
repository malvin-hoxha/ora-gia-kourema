import { ArrowRightIcon, CalendarDaysIcon, ClockIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  const stats = [
    {
      value: "4.9",
      label: "Βαθμολογία πελατών",
    },
    {
      value: "3",
      label: "Έμπειροι barbers",
    },
    {
      value: "10+",
      label: "Χρόνια εμπειρίας",
    },
  ];

  return (
    <section
      id="home"
      className="relative isolate min-h-screen overflow-hidden bg-white"
    >
      {/* Subtle background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      {/* Orange glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.12)_0%,transparent_70%)]"
      />

      {/* Hero content */}
      <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-24 text-center sm:px-8 sm:pt-28 lg:pt-32">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
          <span className="size-1.5 rounded-full bg-orange-500" />
          Modern barber experience
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-5xl font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-slate-900 sm:text-6xl md:text-7xl xl:text-8xl">
          Ήρθε η ώρα για το
          <br />
          <span className="italic text-orange-500">επόμενο σου κούρεμα.</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
          Διάλεξε υπηρεσία, barber και ώρα. Κλείσε το ραντεβού σου γρήγορα
          και εύκολα, χωρίς τηλεφωνήματα.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/booking"
            className="..."
          >
            Κλείσε ραντεβού
          </Link>

          <a
            href="#services"
            className="inline-flex w-full items-center justify-center rounded-full border-[1.5px] border-black/10 bg-white/60 px-8 py-3.5 text-[15px] font-semibold text-slate-700 backdrop-blur transition-all hover:border-black/20 hover:bg-black/5 sm:w-auto"
          >
            Δες τις υπηρεσίες
          </a>
        </div>

        <p className="mt-5 text-xs text-gray-400">
          Γρήγορη κράτηση · Χωρίς τηλεφωνήματα
        </p>
      </div>

      {/* Booking mockup */}
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-[0_-10px_60px_rgba(15,23,42,0.06)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 max-w-xs flex-1 rounded-md bg-white/80" />
          </div>

          {/* Mockup content */}
          <div className="bg-[#f7f7f7] p-4 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
              {/* Stats and details */}
              <div>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-black/[0.06] bg-white p-4 text-left"
                    >
                      <div className="text-2xl font-bold tabular-nums text-gray-900">
                        {stat.value}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-black/[0.06] bg-white p-5 text-left">
                  <div className="mb-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Γιατί να κλείσεις online
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                        <CalendarDaysIcon className="size-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Επίλεξε την υπηρεσία σου
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Βρες την υπηρεσία που ταιριάζει στο στυλ σου.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                        <ClockIcon className="size-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Διάλεξε διαθέσιμη ώρα
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Κλείσε άμεσα, χωρίς αναμονή και τηλεφωνήματα.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability card */}
              <div className="flex flex-col justify-between rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-6 text-left">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 shadow-sm">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Open today
                  </span>

                  <span className="text-xs font-medium text-gray-400">
                    09:00–21:00
                  </span>
                </div>

                <div className="mt-16">
                  <p className="text-sm font-medium text-orange-500">
                    Next available
                  </p>

                  <p className="mt-2 font-serif text-6xl tracking-tight text-slate-900">
                    17:30
                  </p>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-gray-500">
                    Κλείσε το επόμενο διαθέσιμο ραντεβού γρήγορα και εύκολα.
                  </p>

                  <a
                    href="#booking"
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Έλεγχος διαθεσιμότητας
                    <ArrowRightIcon className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}