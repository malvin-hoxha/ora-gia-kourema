
import {
  ArrowRightIcon,
  Clock3Icon,
  ScissorsIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useServices } from "../../hooks/useServices";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function ServicesSection() {
  const {
    data: services = [],
    isPending,
    isError,
  } = useServices();

  return (
    <section
      id="services"
      className="relative isolate overflow-hidden bg-white py-24 sm:py-32"
    >
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-64 bottom-0 size-[460px] rounded-full bg-orange-50 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        {/* Section header */}
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
              <span className="size-1.5 rounded-full bg-orange-500" />
              Οι υπηρεσίες μας
            </div>

            <h2 className="mt-6 font-serif text-4xl leading-[1.02] tracking-[-0.035em] text-slate-900 sm:text-5xl lg:text-6xl">
              Ό,τι χρειάζεσαι για την καλύτερη εκδοχή του{" "}
              <span className="italic text-orange-500">
                στυλ σου.
              </span>
            </h2>
          </div>

          <p className="max-w-md text-base leading-7 text-gray-500 sm:text-lg">
            Επίλεξε την υπηρεσία που σου ταιριάζει και
            κλείσε online το ραντεβού σου με τον barber
            που προτιμάς.
          </p>
        </div>

        {/* Browser-style services container */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 max-w-xs flex-1 rounded-md bg-white/80" />

            <span className="hidden text-xs font-medium text-gray-400 sm:block">
              Επιλογή υπηρεσίας
            </span>
          </div>

          <div className="bg-[#f7f7f7] p-4 sm:p-6">
            {isPending && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="min-h-[350px] animate-pulse rounded-2xl border border-black/[0.06] bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-full bg-gray-100" />
                      <div className="h-7 w-24 rounded-full bg-gray-100" />
                    </div>

                    <div className="mt-10 size-12 rounded-2xl bg-gray-100" />

                    <div className="mt-6 h-8 w-2/3 rounded bg-gray-100" />

                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full rounded bg-gray-100" />
                      <div className="h-4 w-5/6 rounded bg-gray-100" />
                      <div className="h-4 w-3/5 rounded bg-gray-100" />
                    </div>

                    <div className="mt-10 flex items-end justify-between border-t border-black/[0.06] pt-5">
                      <div>
                        <div className="h-3 w-10 rounded bg-gray-100" />
                        <div className="mt-2 h-8 w-20 rounded bg-gray-100" />
                      </div>

                      <div className="size-12 rounded-full bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
                <p className="font-medium text-red-700">
                  Δεν ήταν δυνατή η φόρτωση των υπηρεσιών.
                </p>

                <p className="mt-2 text-sm text-red-500">
                  Έλεγξε ότι το API λειτουργεί και προσπάθησε
                  ξανά.
                </p>
              </div>
            )}

            {!isPending &&
              !isError &&
              services.length === 0 && (
                <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-10 text-center">
                  <p className="font-medium text-slate-700">
                    Δεν υπάρχουν διαθέσιμες υπηρεσίες.
                  </p>
                </div>
              )}

            {!isPending &&
              !isError &&
              services.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services.map((service, index) => (
                    <article
                      key={service.id}
                      className="group relative flex min-h-[350px] flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_16px_45px_rgba(15,23,42,0.09)]"
                    >
                      {/* Hover glow */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-orange-100/0 blur-3xl transition duration-300 group-hover:bg-orange-100/80"
                      />

                      <div className="relative">
                        {/* Card header */}
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex size-10 items-center justify-center rounded-full border border-orange-100 bg-orange-50 font-serif text-sm text-orange-600">
                            {String(index + 1).padStart(
                              2,
                              "0",
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
                            <Clock3Icon className="size-3.5 text-orange-500" />
                            {service.duration} λεπτά
                          </span>
                        </div>

                        {/* Icon */}
                        <div className="mt-10 flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition-colors duration-300 group-hover:bg-orange-500">
                          <ScissorsIcon className="size-5" />
                        </div>

                        {/* Service content */}
                        <h3 className="mt-6 font-serif text-3xl leading-tight tracking-[-0.025em] text-slate-900">
                          {service.name}
                        </h3>

                        <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base sm:leading-7">
                          {service.description}
                        </p>
                      </div>

                      {/* Price and action */}
                      <div className="relative mt-10 flex items-end justify-between gap-4 border-t border-black/[0.06] pt-5">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                            Τιμή
                          </p>

                          <p className="mt-1 font-serif text-3xl tracking-tight text-slate-900">
                            {currencyFormatter.format(
                              service.price,
                            )}
                          </p>
                        </div>

                        <Link
                          to="/booking"
                          className="inline-flex size-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.24)] transition-all hover:bg-orange-600 hover:shadow-[0_10px_28px_rgba(249,115,22,0.34)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                          aria-label={`Επιλογή υπηρεσίας ${service.name}`}
                        >
                          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50/70 px-5 py-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
              <ScissorsIcon className="size-4" />
            </div>

            <p className="text-sm text-gray-500">
              Δεν είσαι σίγουρος ποια υπηρεσία χρειάζεσαι;
              <span className="ml-1 font-semibold text-slate-700">
                Ο barber σου θα σε βοηθήσει να επιλέξεις.
              </span>
            </p>
          </div>

          <Link
            to="/booking"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
          >
            Κλείσε ραντεβού
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
