import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CircleCheckBigIcon,
  Clock3Icon,
  LoaderCircleIcon,
  ScissorsIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react";

import { useRef } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  getAppointmentPaymentStatus,
  type AppointmentPaymentResult,
} from "../api/appointments.api";

function formatAppointmentDate(
  value: string | null,
) {
  if (!value) {
    return "Μη διαθέσιμη ημερομηνία";
  }

  return new Intl.DateTimeFormat(
    "el-GR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function formatPrice(
  value: number | null,
) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    "el-GR",
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(value);
}

export function PaymentSuccessPage() {
  const [searchParams] =
    useSearchParams();

  const sessionId =
    searchParams.get("session_id")?.trim() ??
    "";

  /*
   * Stop automatic polling after 30 seconds.
   * The user can still refresh the page.
   */
  const pollingStartedAt =
    useRef(Date.now());

  const paymentQuery = useQuery({
    queryKey: [
      "appointment-payment-status",
      sessionId,
    ],

    queryFn: () =>
      getAppointmentPaymentStatus(
        sessionId,
      ),

    enabled: Boolean(sessionId),

    retry: 1,

    refetchInterval: (query) => {
      const payment =
        query.state.data;

      const pollingTimedOut =
        Date.now() -
          pollingStartedAt.current >
        30_000;

      if (pollingTimedOut) {
        return false;
      }

      if (
        payment?.state ===
          "PROCESSING" ||
        payment?.state === "PENDING"
      ) {
        return 1_500;
      }

      return false;
    },
  });

  if (!sessionId) {
    return (
      <PaymentMessageLayout>
        <TriangleAlertIcon className="size-12 text-red-500" />

        <h1 className="mt-5 font-serif text-3xl text-slate-900">
          Μη έγκυρη επιστροφή πληρωμής
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Δεν βρέθηκε Stripe Checkout
          Session στη διεύθυνση.
        </p>
      </PaymentMessageLayout>
    );
  }

  if (paymentQuery.isPending) {
    return (
      <PaymentMessageLayout>
        <LoaderCircleIcon className="size-12 animate-spin text-orange-500" />

        <h1 className="mt-5 font-serif text-3xl text-slate-900">
          Ελέγχουμε την πληρωμή
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Περίμενε λίγα δευτερόλεπτα όσο
          επιβεβαιώνουμε τη συναλλαγή.
        </p>
      </PaymentMessageLayout>
    );
  }

  if (
    paymentQuery.isError ||
    !paymentQuery.data
  ) {
    return (
      <PaymentMessageLayout>
        <TriangleAlertIcon className="size-12 text-red-500" />

        <h1 className="mt-5 font-serif text-3xl text-slate-900">
          Δεν ήταν δυνατός ο έλεγχος
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Δεν μπορέσαμε να επιβεβαιώσουμε
          αυτή τη στιγμή την κατάσταση της
          πληρωμής.
        </p>

        <button
          type="button"
          onClick={() =>
            void paymentQuery.refetch()
          }
          className="mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Νέα προσπάθεια
        </button>
      </PaymentMessageLayout>
    );
  }

  if (
    paymentQuery.data.state ===
      "PROCESSING" ||
    paymentQuery.data.state ===
      "PENDING"
  ) {
    return (
      <PaymentMessageLayout>
        <LoaderCircleIcon className="size-12 animate-spin text-orange-500" />

        <h1 className="mt-5 font-serif text-3xl text-slate-900">
          Η πληρωμή επεξεργάζεται
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
          Η επιστροφή από τη Stripe
          ολοκληρώθηκε. Περιμένουμε την
          τελική επιβεβαίωση από το ασφαλές
          webhook.
        </p>

        <button
          type="button"
          onClick={() =>
            void paymentQuery.refetch()
          }
          className="mt-6 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200"
        >
          Έλεγχος ξανά
        </button>
      </PaymentMessageLayout>
    );
  }

  if (
    paymentQuery.data.state === "EXPIRED"
  ) {
    return (
      <PaymentMessageLayout>
        <TriangleAlertIcon className="size-12 text-orange-500" />

        <h1 className="mt-5 font-serif text-3xl text-slate-900">
          Η πληρωμή δεν ολοκληρώθηκε
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
          Η Checkout Session έληξε και το
          προσωρινό ραντεβού ακυρώθηκε.
        </p>

        <Link
          to="/booking"
          className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Νέα κράτηση
        </Link>
      </PaymentMessageLayout>
    );
  }

  return (
    <PaidAppointment
      payment={paymentQuery.data}
    />
  );
}

type PaymentMessageLayoutProps = {
  children: React.ReactNode;
};

function PaymentMessageLayout({
  children,
}: PaymentMessageLayoutProps) {
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
        {children}

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="size-4" />
          Επιστροφή στην αρχική
        </Link>
      </section>
    </main>
  );
}

type PaidAppointmentProps = {
  payment: AppointmentPaymentResult;
};

function PaidAppointment({
  payment,
}: PaidAppointmentProps) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div className="relative mx-auto max-w-2xl">
        <section className="rounded-3xl border border-black/5 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-50">
              <CircleCheckBigIcon className="size-9 text-green-600" />
            </div>

            <h1 className="mt-6 font-serif text-4xl tracking-tight text-slate-900">
              Η πληρωμή ολοκληρώθηκε.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Το ραντεβού σου καταχωρήθηκε
              επιτυχώς.
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-5">
            <AppointmentRow
              icon={
                <ScissorsIcon className="size-4" />
              }
              label="Υπηρεσία"
              value={
                payment.service.name
              }
            />

            <AppointmentRow
              icon={
                <UserRoundIcon className="size-4" />
              }
              label="Barber"
              value={payment.barber.name}
            />

            <AppointmentRow
              icon={
                <CalendarDaysIcon className="size-4" />
              }
              label="Ημερομηνία"
              value={formatAppointmentDate(
                payment.localStartsAt,
              )}
            />

            <AppointmentRow
              icon={
                <Clock3Icon className="size-4" />
              }
              label="Κατάσταση"
              value="Πληρωμένο"
            />

            <AppointmentRow
              icon={
                <CircleCheckBigIcon className="size-4" />
              }
              label="Σύνολο"
              value={formatPrice(
                payment.priceAtBooking,
              )}
            />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Τα ραντεβού μου
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200"
            >
              Επιστροφή στην αρχική
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

type AppointmentRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function AppointmentRow({
  icon,
  label,
  value,
}: AppointmentRowProps) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>

      <p className="text-right text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}