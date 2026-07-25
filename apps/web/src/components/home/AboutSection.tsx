import {
  CheckIcon,
  ScissorsIcon,
  SparklesIcon,
} from "lucide-react";

export function AboutSection() {
  const highlights = [
    {
      icon: ScissorsIcon,
      title: "Παραδοσιακή τεχνική",
      description:
        "Προσοχή στη λεπτομέρεια και τεχνικές που βασίζονται στην εμπειρία.",
    },
    {
      icon: SparklesIcon,
      title: "Σύγχρονη εμπειρία",
      description:
        "Εύκολη κράτηση, οργανωμένο πρόγραμμα και καθόλου περιττή αναμονή.",
    },
  ];

  return (
    <section
      id="about"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Subtle background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Visual card */}
        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
              <div className="size-3 rounded-full bg-red-400" />
              <div className="size-3 rounded-full bg-amber-400" />
              <div className="size-3 rounded-full bg-emerald-400" />

              <div className="mx-4 h-5 max-w-48 flex-1 rounded-md bg-white/80" />
            </div>

            <div className="bg-[#f7f7f7] p-4 sm:p-6">
              <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-6 sm:p-8">
                {/* Decorative glow */}
                <div
                  aria-hidden="true"
                  className="absolute -right-20 -top-20 size-64 rounded-full bg-orange-200/50 blur-3xl"
                />

                <div className="relative flex h-full min-h-[400px] flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 shadow-sm">
                      <span className="size-1.5 rounded-full bg-orange-500" />
                      Since 2014
                    </span>

                    <div className="flex size-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-orange-500 shadow-sm">
                      <ScissorsIcon className="size-4" />
                    </div>
                  </div>

                  <div>
                    <p className="font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-slate-900 sm:text-6xl">
                      Good hair.
                      <br />
                      <span className="italic text-orange-500">Good mood.</span>
                      <br />
                      Good day.
                    </p>

                    <div className="mt-8 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-xs font-semibold text-white"
                          >
                            B{item}
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Έμπειρη ομάδα barbers
                        </p>
                        <p className="text-xs text-gray-400">
                          Με κοινό στόχο το καλύτερο αποτέλεσμα
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
            <span className="size-1.5 rounded-full bg-orange-500" />
            Σχετικά με εμάς
          </div>

          <h2 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.02] tracking-[-0.035em] text-slate-900 sm:text-5xl lg:text-6xl">
            Το κλασικό barbershop σε μία{" "}
            <span className="italic text-orange-500">
              πιο σύγχρονη εκδοχή.
            </span>
          </h2>

          <p className="mt-7 max-w-xl text-base leading-7 text-gray-500 sm:text-lg sm:leading-8">
            Συνδυάζουμε την εμπειρία του παραδοσιακού barber με μια σύγχρονη
            διαδικασία κράτησης. Χωρίς αναμονή, χωρίς τηλεφωνήματα και χωρίς
            αβεβαιότητα.
          </p>

          {/* Highlights */}
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-black/[0.06] bg-white/80 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(15,23,42,0.07)]"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <Icon className="size-4" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    {highlight.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {highlight.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
            <div className="p-5 sm:p-6">
              <p className="font-serif text-4xl tracking-tight text-slate-900">
                2.500+
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Ολοκληρωμένα ραντεβού
              </p>
            </div>

            <div className="border-l border-black/[0.06] p-5 sm:p-6">
              <p className="font-serif text-4xl tracking-tight text-slate-900">
                98%
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Ικανοποιημένοι πελάτες
              </p>
            </div>
          </div>

          {/* Trust note */}
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckIcon className="size-3" />
            </span>
            Ποιοτική εξυπηρέτηση σε κάθε ραντεβού
          </div>
        </div>
      </div>
    </section>
  );
}