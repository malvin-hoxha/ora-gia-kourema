import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  Clock3Icon,
  HistoryIcon,
  LoaderCircleIcon,
  ScissorsIcon,
  UserRoundIcon,
  XCircleIcon,
  Building2Icon,
  RefreshCcwIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/api-client";
import type {
  Appointment,
  AppointmentStatus,
} from "../api/appointments.api";
import { useAuth } from "../auth/useAuth";
import { useCancelAppointment } from "../hooks/useCancelAppointment";
import { useMyAppointments } from "../hooks/useMyAppointments";

type DashboardTab = "upcoming" | "history";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export function DashboardPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] =
    useState<DashboardTab>("upcoming");

  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);

  const appointmentsQuery = useMyAppointments();
  const cancelMutation = useCancelAppointment();

  const appointments =
    activeTab === "upcoming"
      ? appointmentsQuery.data?.upcoming ?? []
      : appointmentsQuery.data?.history ?? [];

  async function confirmCancellation() {
    if (!appointmentToCancel) {
      return;
    }

    try {
      await cancelMutation.mutateAsync(
        appointmentToCancel.id,
      );

      setAppointmentToCancel(null);
    } catch {
      // Το error εμφανίζεται μέσα στο modal.
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white px-5 py-8 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon className="size-4" />
            Αρχική
          </Link>

          <p className="font-serif text-xl text-slate-900">
            OraGiaKourema
            <span className="text-orange-500">.</span>
          </p>
        </header>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
                <UserRoundIcon className="size-3.5" />
                Ο λογαριασμός μου
              </div>

              <h1 className="mt-6 font-serif text-4xl tracking-[-0.035em] text-slate-900 sm:text-5xl">
                Γεια σου, {user?.name}.
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
                Εδώ μπορείς να δεις και να διαχειριστείς
                τα ραντεβού σου.
              </p>
            </div>

            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <ScissorsIcon className="size-4" />
              Νέο ραντεβού
            </Link>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 max-w-xs flex-1 rounded-md bg-white/80" />

            <span className="hidden text-xs font-medium text-gray-400 sm:block">
              Τα ραντεβού μου
            </span>
          </div>

          <div className="bg-[#f7f7f7] p-4 sm:p-7">
            <div className="inline-flex rounded-full border border-black/[0.07] bg-white p-1">
              <button
                type="button"
                onClick={() =>
                  setActiveTab("upcoming")
                }
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  activeTab === "upcoming"
                    ? "bg-slate-900 text-white"
                    : "text-gray-500 hover:text-slate-900",
                ].join(" ")}
              >
                <CalendarDaysIcon className="size-4" />
                Επόμενα
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    activeTab === "upcoming"
                      ? "bg-white/15 text-white"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {appointmentsQuery.data?.upcoming
                    .length ?? 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("history")
                }
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  activeTab === "history"
                    ? "bg-slate-900 text-white"
                    : "text-gray-500 hover:text-slate-900",
                ].join(" ")}
              >
                <HistoryIcon className="size-4" />
                Ιστορικό
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    activeTab === "history"
                      ? "bg-white/15 text-white"
                      : "bg-gray-100 text-gray-500",
                  ].join(" ")}
                >
                  {appointmentsQuery.data?.history
                    .length ?? 0}
                </span>
              </button>
            </div>

            {appointmentsQuery.isPending && (
              <LoadingAppointments />
            )}

            {appointmentsQuery.isError && (
              <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                <p className="font-medium text-red-700">
                  Δεν ήταν δυνατή η φόρτωση των
                  ραντεβού.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void appointmentsQuery.refetch();
                  }}
                  className="mt-4 text-sm font-semibold text-red-600 underline underline-offset-4"
                >
                  Προσπάθησε ξανά
                </button>
              </div>
            )}

            {!appointmentsQuery.isPending &&
              !appointmentsQuery.isError &&
              appointments.length === 0 && (
                <EmptyAppointments
                  tab={activeTab}
                />
              )}

            {!appointmentsQuery.isPending &&
              !appointmentsQuery.isError &&
              appointments.length > 0 && (
                <div className="mt-7 grid gap-4">
                  {appointments.map(
                    (appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        showCancelButton={
                          activeTab === "upcoming"
                        }
                        onCancel={() =>
                          setAppointmentToCancel(
                            appointment,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
          </div>
        </section>
      </div>

      {appointmentToCancel && (
        <CancelAppointmentModal
          appointment={appointmentToCancel}
          isPending={cancelMutation.isPending}
          error={cancelMutation.error}
          onClose={() => {
            if (!cancelMutation.isPending) {
              setAppointmentToCancel(null);
              cancelMutation.reset();
            }
          }}
          onConfirm={() => {
            void confirmCancellation();
          }}
        />
      )}
    </main>
  );
}


type CancellationDetails = {
  title: string;
  description: string;
  tone: "customer" | "store" | "generic";
};

function getCancellationDetails(
  appointment: Appointment,
): CancellationDetails | null {
  if (appointment.status !== "CANCELLED") {
    return null;
  }

  if (appointment.cancelledBy === "CUSTOMER") {
    return {
      title: "Ακυρώθηκε από εσένα",
      description:
        "Το ραντεβού ακυρώθηκε από τον λογαριασμό σου.",
      tone: "customer",
    };
  }

  if (
    appointment.cancelledBy === "BARBER" ||
    appointment.cancelledBy === "ADMIN" ||
    appointment.cancelledBy === "SYSTEM"
  ) {
    const isTimeOffCancellation =
      appointment.cancellationReason ===
      "Barber time off";

    return {
      title: "Ακυρώθηκε από το κατάστημα",
      description: isTimeOffCancellation
        ? "Το ραντεβού ακυρώθηκε λόγω αλλαγής στο πρόγραμμα του barber. Μπορείς να επιλέξεις νέα διαθέσιμη ώρα."
        : appointment.cancellationReason ||
          "Το ραντεβού ακυρώθηκε από το κατάστημα.",
      tone: "store",
    };
  }

  return {
    title: "Το ραντεβού ακυρώθηκε",
    description:
      appointment.cancellationReason ||
      "Δεν υπάρχουν διαθέσιμες περισσότερες πληροφορίες για την ακύρωση.",
    tone: "generic",
  };
}

function formatCancellationDate(
  cancelledAt: string | null,
) {
  if (!cancelledAt) {
    return null;
  }

  return new Intl.DateTimeFormat("el-GR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(cancelledAt));
}

type AppointmentCardProps = {
  appointment: Appointment;
  showCancelButton: boolean;
  onCancel: () => void;
};

function AppointmentCard({
  appointment,
  showCancelButton,
  onCancel,
}: AppointmentCardProps) {
  const startDate = new Date(
    appointment.localStartsAt,
  );

  const formattedDate =
    new Intl.DateTimeFormat("el-GR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(startDate);

  const formattedTime =
    new Intl.DateTimeFormat("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(startDate);

  const canBeCancelled =
    showCancelButton &&
    (appointment.status === "PENDING" ||
      appointment.status === "CONFIRMED");

  const cancellationDetails =
    getCancellationDetails(appointment);

  const formattedCancellationDate =
    formatCancellationDate(
      appointment.cancelledAt,
    );

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5 transition hover:border-orange-100 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <ScissorsIcon className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-2xl text-slate-900">
                {appointment.service.name}
              </h2>

              <StatusBadge
                status={appointment.status}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDaysIcon className="size-4 text-orange-500" />
                {formattedDate}
              </span>

              <span className="inline-flex items-center gap-2">
                <Clock3Icon className="size-4 text-orange-500" />
                {formattedTime}
              </span>

              <span className="inline-flex items-center gap-2">
                <UserRoundIcon className="size-4 text-orange-500" />
                {appointment.barber.name}
              </span>
            </div>

            {appointment.notes && (
              <p className="mt-4 max-w-2xl rounded-xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-500">
                {appointment.notes}
              </p>
            )}

            {cancellationDetails && (
              <div
                className={[
                  "mt-5 max-w-2xl rounded-xl border px-4 py-4",
                  cancellationDetails.tone === "store"
                    ? "border-red-100 bg-red-50"
                    : cancellationDetails.tone === "customer"
                      ? "border-gray-200 bg-gray-50"
                      : "border-amber-100 bg-amber-50",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      cancellationDetails.tone === "store"
                        ? "bg-white text-red-600"
                        : cancellationDetails.tone === "customer"
                          ? "bg-white text-gray-500"
                          : "bg-white text-amber-600",
                    ].join(" ")}
                  >
                    {cancellationDetails.tone === "store" ? (
                      <Building2Icon className="size-4" />
                    ) : (
                      <XCircleIcon className="size-4" />
                    )}
                  </div>

                  <div>
                    <p
                      className={[
                        "text-sm font-semibold",
                        cancellationDetails.tone === "store"
                          ? "text-red-700"
                          : cancellationDetails.tone === "customer"
                            ? "text-slate-700"
                            : "text-amber-700",
                      ].join(" ")}
                    >
                      {cancellationDetails.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {cancellationDetails.description}
                    </p>

                    {formattedCancellationDate && (
                      <p className="mt-2 text-xs text-gray-400">
                        Ακυρώθηκε στις {formattedCancellationDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-5 border-t border-black/[0.06] pt-5 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
              Σύνολο
            </p>

            <p className="mt-1 font-serif text-2xl text-slate-900">
              {currencyFormatter.format(
                appointment.service.price,
              )}
            </p>
          </div>

          {canBeCancelled && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100"
            >
              <XCircleIcon className="size-4" />
              Ακύρωση
            </button>
          )}

          {appointment.status === "CANCELLED" && (
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <RefreshCcwIcon className="size-4" />
              Κλείσε νέο
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

type StatusBadgeProps = {
  status: AppointmentStatus;
};

const statusLabels: Record<
  AppointmentStatus,
  string
> = {
  PENDING: "Σε αναμονή",
  CONFIRMED: "Επιβεβαιωμένο",
  COMPLETED: "Ολοκληρώθηκε",
  CANCELLED: "Ακυρώθηκε",
  NO_SHOW: "Δεν προσήλθε",
};

const statusClasses: Record<
  AppointmentStatus,
  string
> = {
  PENDING:
    "border-amber-100 bg-amber-50 text-amber-700",

  CONFIRMED:
    "border-emerald-100 bg-emerald-50 text-emerald-700",

  COMPLETED:
    "border-blue-100 bg-blue-50 text-blue-700",

  CANCELLED:
    "border-red-100 bg-red-50 text-red-600",

  NO_SHOW:
    "border-gray-200 bg-gray-100 text-gray-600",
};

function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        statusClasses[status],
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}


function LoadingAppointments() {
  return (
    <div className="mt-7 grid gap-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="min-h-40 animate-pulse rounded-2xl border border-black/[0.06] bg-white p-6"
        >
          <div className="flex gap-4">
            <div className="size-12 rounded-2xl bg-gray-100" />

            <div className="flex-1">
              <div className="h-7 w-48 rounded bg-gray-100" />

              <div className="mt-5 flex gap-4">
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="h-4 w-28 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type EmptyAppointmentsProps = {
  tab: DashboardTab;
};

function EmptyAppointments({
  tab,
}: EmptyAppointmentsProps) {
  const isUpcoming = tab === "upcoming";

  return (
    <div className="mt-7 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        {isUpcoming ? (
          <CalendarDaysIcon className="size-6" />
        ) : (
          <HistoryIcon className="size-6" />
        )}
      </div>

      <h2 className="mt-5 font-serif text-2xl text-slate-900">
        {isUpcoming
          ? "Δεν έχεις επόμενο ραντεβού."
          : "Δεν υπάρχει ιστορικό ραντεβού."}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {isUpcoming
          ? "Κλείσε το επόμενο ραντεβού σου επιλέγοντας υπηρεσία, barber και διαθέσιμη ώρα."
          : "Τα ολοκληρωμένα και ακυρωμένα ραντεβού σου θα εμφανιστούν εδώ."}
      </p>

      {isUpcoming && (
        <Link
          to="/booking"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          <ScissorsIcon className="size-4" />
          Κλείσε ραντεβού
        </Link>
      )}
    </div>
  );
}

type CancelAppointmentModalProps = {
  appointment: Appointment;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onConfirm: () => void;
};

function CancelAppointmentModal({
  appointment,
  isPending,
  error,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const formattedDate =
    new Intl.DateTimeFormat("el-GR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(
      new Date(appointment.localStartsAt),
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-appointment-title"
        className="w-full max-w-md rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <XCircleIcon className="size-6" />
        </div>

        <h2
          id="cancel-appointment-title"
          className="mt-6 font-serif text-3xl text-slate-900"
        >
          Ακύρωση ραντεβού;
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Πρόκειται να ακυρώσεις το ραντεβού για{" "}
          <strong className="font-semibold text-slate-700">
            {appointment.service.name}
          </strong>{" "}
          με τον{" "}
          <strong className="font-semibold text-slate-700">
            {appointment.barber.name}
          </strong>
          .
        </p>

        <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-slate-700">
          {formattedDate}
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-400">
          Η ακύρωση επιτρέπεται μέχρι δύο ώρες πριν
          από την έναρξη του ραντεβού.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error instanceof ApiError
              ? error.message
              : "Δεν ήταν δυνατή η ακύρωση του ραντεβού."}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Επιστροφή
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <XCircleIcon className="size-4" />
            )}

            Επιβεβαίωση ακύρωσης
          </button>
        </div>
      </div>
    </div>
  );
}