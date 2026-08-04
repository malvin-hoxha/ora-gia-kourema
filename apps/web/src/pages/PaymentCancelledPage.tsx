import {
  ArrowLeftIcon,
  CreditCardIcon,
  RotateCcwIcon,
} from "lucide-react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

export function PaymentCancelledPage() {
  const [searchParams] =
    useSearchParams();

  const appointmentId =
    searchParams.get("appointmentId");

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,transparent_70%)]"
      />

      <section className="relative w-full max-w-xl rounded-3xl border border-black/5 bg-white/90 p-8 text-center shadow-xl shadow-slate-900/5 backdrop-blur sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-50">
          <CreditCardIcon className="size-8 text-orange-500" />
        </div>

        <h1 className="mt-6 font-serif text-4xl tracking-tight text-slate-900">
          Η πληρωμή δεν ολοκληρώθηκε.
        </h1>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          Δεν πραγματοποιήθηκε κάποια
          χρέωση. Το ραντεβού παραμένει
          προσωρινά κρατημένο μέχρι να λήξει
          η Stripe Checkout Session και στη
          συνέχεια θα ακυρωθεί αυτόματα.
        </p>

        {appointmentId && (
          <p className="mt-4 break-all rounded-xl bg-slate-50 px-4 py-3 text-xs text-gray-400">
            Κωδικός προσωρινής κράτησης:{" "}
            {appointmentId}
          </p>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            to="/booking"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <RotateCcwIcon className="size-4" />
            Νέα κράτηση
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200"
          >
            <ArrowLeftIcon className="size-4" />
            Αρχική
          </Link>
        </div>
      </section>
    </main>
  );
}