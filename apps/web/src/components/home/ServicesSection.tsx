import { ArrowRightIcon, Clock3Icon, ScissorsIcon } from "lucide-react";
import { useEffect, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

type ServicesResponse = {
  data: Service[];
};

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadServices() {
      try {
        setIsLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL;

        if (!apiUrl) {
          throw new Error("VITE_API_URL is not configured");
        }

        const response = await fetch(`${apiUrl}/services`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Services request failed: ${response.status}`);
        }

        const result = (await response.json()) as ServicesResponse;
        setServices(result.data);

      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load services:", error);
        setError("Δεν ήταν δυνατή η φόρτωση των υπηρεσιών.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
     void loadServices();

    return () => {
      controller.abort();
    };
  },  []);

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
              <span className="italic text-orange-500">στυλ σου.</span>
            </h2>
          </div>

          <p className="max-w-md text-base leading-7 text-gray-500 sm:text-lg">
            Επίλεξε την υπηρεσία που σου ταιριάζει και κλείσε online το
            ραντεβού σου με τον barber που προτιμάς.
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
                        {String(index + 1).padStart(2, "0")}
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
                        {currencyFormatter.format(service.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="inline-flex size-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_8px_20px_rgba(249,115,22,0.24)] transition-all hover:bg-orange-600 hover:shadow-[0_10px_28px_rgba(249,115,22,0.34)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      aria-label={`Επιλογή υπηρεσίας ${service.name}`}
                    >
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
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

          <a
            href="#booking"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
          >
            Κλείσε ραντεβού
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}