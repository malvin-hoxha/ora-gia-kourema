import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  EuroIcon,
  HistoryIcon,
  LoaderCircleIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  StoreIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/api-client";
import type {
  AdminAppointment,
  AdminAppointmentStatus,
} from "../api/admin.api";
import { useAuth } from "../auth/useAuth";
import { useAdminAppointments } from "../hooks/useAdminAppointments";
import { useAdminOverview } from "../hooks/useAdminOverview";
import { useBarbers } from "../hooks/useBarbers";
import {
  useUpdateAdminAppointmentStatus,
} from "../hooks/useUpdateAdminAppointmentStatus";

import type {
  UpdateAdminAppointmentStatus,
} from "../api/admin.api";

type StatusFilter =
  | ""
  | AdminAppointmentStatus;

const currencyFormatter =
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  });

function toDateInputValue(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const statusOptions: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "",
    label: "Όλα",
  },
  {
    value: "PENDING",
    label: "Σε αναμονή",
  },
  {
    value: "CONFIRMED",
    label: "Επιβεβαιωμένα",
  },
  {
    value: "COMPLETED",
    label: "Ολοκληρωμένα",
  },
  {
    value: "CANCELLED",
    label: "Ακυρωμένα",
  },
  {
    value: "NO_SHOW",
    label: "No-show",
  },
];

export function AdminDashboardPage() {
  const { user, logout } = useAuth();

  const [selectedDate, setSelectedDate] =
    useState(() =>
      toDateInputValue(new Date()),
    );

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("");

  const [barberId, setBarberId] =
    useState("");

  const [
    pendingStatusChange,
    setPendingStatusChange,
  ] = useState<{
    appointment: AdminAppointment;
    status: UpdateAdminAppointmentStatus;
  } | null>(null);

  const updateStatusMutation =
    useUpdateAdminAppointmentStatus();

  const overviewQuery =
    useAdminOverview();

  const barbersQuery = useBarbers();

  const appointmentsQuery =
    useAdminAppointments({
      date: selectedDate || undefined,
      status: statusFilter,
      barberId: barberId || undefined,
    });

  const overview = overviewQuery.data;

  const appointments =
    appointmentsQuery.data
      ?.appointments ?? [];

  async function confirmStatusChange() {
    if (!pendingStatusChange) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        appointmentId:
          pendingStatusChange.appointment.id,
        status:
          pendingStatusChange.status,
      });

      setPendingStatusChange(null);
    } catch {
      // Το mutation error εμφανίζεται στο modal.
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
        className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[950px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <Link
            to="/"
            className="font-serif text-xl text-slate-900"
          >
            OraGiaKourema
            <span className="text-orange-500">
              .
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-black/[0.07] bg-white px-3 py-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <ShieldCheckIcon className="size-4" />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>

                <p className="text-xs text-gray-400">
                  Administrator
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
            >
              Αποσύνδεση
            </button>
          </div>
        </header>

        <section className="mt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
            <ShieldCheckIcon className="size-3.5" />
            Admin dashboard
          </div>

          <h1 className="mt-6 font-serif text-4xl tracking-[-0.035em] text-slate-900 sm:text-5xl">
            Επισκόπηση καταστήματος.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Παρακολούθησε τα βασικά στοιχεία
            λειτουργίας και όλα τα ραντεβού του
            καταστήματος.
          </p>
        </section>

        {overviewQuery.isPending && (
          <OverviewLoading />
        )}

        {overviewQuery.isError && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-7 text-center">
            <p className="font-semibold text-red-700">
              Δεν ήταν δυνατή η φόρτωση των
              στατιστικών.
            </p>

            <button
              type="button"
              onClick={() => {
                void overviewQuery.refetch();
              }}
              className="mt-3 text-sm font-semibold text-red-600 underline underline-offset-4"
            >
              Προσπάθησε ξανά
            </button>
          </div>
        )}

        {overview && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              icon={
                <UserRoundIcon className="size-5" />
              }
              label="Πελάτες"
              value={overview.customersCount}
              description="Εγγεγραμμένοι λογαριασμοί"
            />

            <OverviewCard
              icon={
                <UsersRoundIcon className="size-5" />
              }
              label="Barbers"
              value={overview.barbersCount}
              description={`${overview.activeBarbersCount} ενεργοί`}
            />

            <OverviewCard
              icon={
                <ScissorsIcon className="size-5" />
              }
              label="Υπηρεσίες"
              value={overview.servicesCount}
              description="Διαθέσιμες υπηρεσίες"
            />

            <OverviewCard
              icon={
                <EuroIcon className="size-5" />
              }
              label="Σημερινός τζίρος"
              value={currencyFormatter.format(
                overview.todayRevenue,
              )}
              description="Από ολοκληρωμένα ραντεβού"
            />

            <OverviewCard
              icon={
                <CalendarDaysIcon className="size-5" />
              }
              label="Σήμερα"
              value={
                overview.appointments.today
              }
              description="Συνολικά ραντεβού"
            />

            <OverviewCard
              icon={
                <Clock3Icon className="size-5" />
              }
              label="Σε αναμονή"
              value={
                overview.appointments.pending
              }
              description="Χρειάζονται διαχείριση"
            />

            <OverviewCard
              icon={
                <CheckCircle2Icon className="size-5" />
              }
              label="Επιβεβαιωμένα"
              value={
                overview.appointments.confirmed
              }
              description="Μελλοντικά appointments"
            />

            <OverviewCard
              icon={
                <StoreIcon className="size-5" />
              }
              label="Ανενεργοί barbers"
              value={
                overview.inactiveBarbersCount
              }
              description="Μη διαθέσιμα προφίλ"
            />
          </section>
        )}

        <section className="mt-10 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 max-w-sm flex-1 rounded-md bg-white/80" />

            <span className="hidden text-xs font-medium text-gray-400 sm:block">
              Όλα τα ραντεβού
            </span>
          </div>

          <div className="bg-[#f7f7f7] p-4 sm:p-7">
            <AdminAppointmentFilters
              selectedDate={selectedDate}
              statusFilter={statusFilter}
              barberId={barberId}
              barbers={
                barbersQuery.data ?? []
              }
              onDateChange={setSelectedDate}
              onStatusChange={
                setStatusFilter
              }
              onBarberChange={setBarberId}
              onClear={() => {
                setSelectedDate("");
                setStatusFilter("");
                setBarberId("");
              }}
            />

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl text-slate-900">
                  Ραντεβού
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {appointments.length} αποτελέσματα
                </p>
              </div>

              {appointmentsQuery.isFetching &&
                !appointmentsQuery.isPending && (
                  <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                    <LoaderCircleIcon className="size-4 animate-spin" />
                    Ανανέωση
                  </div>
                )}
            </div>

            {appointmentsQuery.isPending && (
              <AppointmentsLoading />
            )}

            {appointmentsQuery.isError && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                <p className="font-semibold text-red-700">
                  Δεν ήταν δυνατή η φόρτωση των
                  ραντεβού.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void appointmentsQuery.refetch();
                  }}
                  className="mt-3 text-sm font-semibold text-red-600 underline underline-offset-4"
                >
                  Προσπάθησε ξανά
                </button>
              </div>
            )}

            {!appointmentsQuery.isPending &&
              !appointmentsQuery.isError &&
              appointments.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
                  <CalendarDaysIcon className="mx-auto size-7 text-gray-300" />

                  <h3 className="mt-4 font-serif text-2xl text-slate-900">
                    Δεν βρέθηκαν ραντεβού.
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Άλλαξε ή καθάρισε τα φίλτρα.
                  </p>
                </div>
              )}

            {!appointmentsQuery.isPending &&
              !appointmentsQuery.isError &&
              appointments.length > 0 && (
                <div className="mt-6 grid gap-4">
                  {appointments.map(
                    (appointment) => (
                      <AdminAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onStatusChange={(status) => {
                          updateStatusMutation.reset();

                          setPendingStatusChange({
                            appointment,
                            status,
                          });
                        }}
                      />
                    ),
                  )}
                </div>
              )}
          </div>
        </section>
      </div>

      {pendingStatusChange && (
        <AdminStatusModal
          appointment={
            pendingStatusChange.appointment
          }
          status={
            pendingStatusChange.status
          }
          isPending={
            updateStatusMutation.isPending
          }
          error={
            updateStatusMutation.error
          }
          onClose={() => {
            if (!updateStatusMutation.isPending) {
              setPendingStatusChange(null);
              updateStatusMutation.reset();
            }
          }}
          onConfirm={() => {
            void confirmStatusChange();
          }}
        />
      )}
    </main>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 font-serif text-3xl text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-400">
        {description}
      </p>
    </article>
  );
}

type AdminAppointmentFiltersProps = {
  selectedDate: string;
  statusFilter: StatusFilter;
  barberId: string;

  barbers: Array<{
    id: string;
    name: string;
  }>;

  onDateChange: (value: string) => void;

  onStatusChange: (
    value: StatusFilter,
  ) => void;

  onBarberChange: (
    value: string,
  ) => void;

  onClear: () => void;
};

function AdminAppointmentFilters({
  selectedDate,
  statusFilter,
  barberId,
  barbers,
  onDateChange,
  onStatusChange,
  onBarberChange,
  onClear,
}: AdminAppointmentFiltersProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Ημερομηνία
          </span>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              onDateChange(
                event.target.value,
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Κατάσταση
          </span>

          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(
                event.target
                  .value as StatusFilter,
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value || "ALL"}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Barber
          </span>

          <select
            value={barberId}
            onChange={(event) =>
              onBarberChange(
                event.target.value,
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
          >
            <option value="">
              Όλοι οι barbers
            </option>

            {barbers.map((barber) => (
              <option
                key={barber.id}
                value={barber.id}
              >
                {barber.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-slate-900"
        >
          Καθαρισμός φίλτρων
        </button>
      </div>
    </div>
  );
}

function AdminAppointmentCard({
  appointment,
  onStatusChange,
}: {
  appointment: AdminAppointment;
  onStatusChange: (
    status: UpdateAdminAppointmentStatus,
  ) => void;
}) {
  const startsAt = new Date(
    appointment.localStartsAt,
  );

  const formattedDate =
    new Intl.DateTimeFormat("el-GR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(startsAt);

  const formattedTime =
    new Intl.DateTimeFormat("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(startsAt);

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-2xl text-slate-900">
              {appointment.service.name}
            </h3>

            <AdminStatusBadge
              status={appointment.status}
            />
          </div>

          <div className="mt-4 grid gap-3 text-sm text-gray-500 sm:grid-cols-2 xl:grid-cols-4">
            <span>
              <strong className="font-semibold text-slate-700">
                Πελάτης:
              </strong>{" "}
              {appointment.customer.name}
            </span>

            <span>
              <strong className="font-semibold text-slate-700">
                Barber:
              </strong>{" "}
              {appointment.barber.name}
            </span>

            <span>
              <strong className="font-semibold text-slate-700">
                Ημερομηνία:
              </strong>{" "}
              {formattedDate}
            </span>

            <span>
              <strong className="font-semibold text-slate-700">
                Ώρα:
              </strong>{" "}
              {formattedTime}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-50 px-3 py-1.5">
              {appointment.customer.email}
            </span>

            {appointment.customer.phone && (
              <span className="rounded-full bg-gray-50 px-3 py-1.5">
                {appointment.customer.phone}
              </span>
            )}

            <span className="rounded-full bg-gray-50 px-3 py-1.5">
              {
                appointment.service
                  .durationMinutes
              }{" "}
              λεπτά
            </span>
          </div>

          {appointment.status ===
            "CANCELLED" && (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">
                Ακύρωση
                {appointment.cancelledBy
                  ? ` από ${getCancelledByLabel(
                      appointment.cancelledBy,
                    )}`
                  : ""}
              </p>

              {appointment.cancellationReason && (
                <p className="mt-1 text-red-600">
                  {
                    appointment.cancellationReason
                  }
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-black/[0.06] pt-5 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0 xl:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
            Αξία
          </p>

          <p className="mt-1 font-serif text-2xl text-slate-900">
            {currencyFormatter.format(
              appointment.service.price,
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 xl:flex-col">
            <AdminStatusActions
              appointment={appointment}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function AdminStatusActions({
  appointment,
  onStatusChange,
}: {
  appointment: AdminAppointment;
  onStatusChange: (
    status: UpdateAdminAppointmentStatus,
  ) => void;
}) {
  if (
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED" ||
    appointment.status === "NO_SHOW"
  ) {
    return (
      <p className="text-sm text-gray-400">
        Δεν υπάρχουν διαθέσιμες ενέργειες.
      </p>
    );
  }

  if (appointment.status === "PENDING") {
    return (
      <>
        <button
          type="button"
          onClick={() =>
            onStatusChange("CONFIRMED")
          }
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Επιβεβαίωση
        </button>

        <button
          type="button"
          onClick={() =>
            onStatusChange("CANCELLED")
          }
          className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          Ακύρωση
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          onStatusChange("COMPLETED")
        }
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Ολοκλήρωση
      </button>

      <button
        type="button"
        onClick={() =>
          onStatusChange("NO_SHOW")
        }
        className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        No-show
      </button>

      <button
        type="button"
        onClick={() =>
          onStatusChange("CANCELLED")
        }
        className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        Ακύρωση
      </button>
    </>
  );
}

const adminStatusActionLabels: Record<
  UpdateAdminAppointmentStatus,
  {
    title: string;
    description: string;
    button: string;
  }
> = {
  CONFIRMED: {
    title: "Επιβεβαίωση ραντεβού",
    description:
      "Το ραντεβού θα εμφανίζεται ως επιβεβαιωμένο.",
    button: "Επιβεβαίωση",
  },
  COMPLETED: {
    title: "Ολοκλήρωση ραντεβού",
    description:
      "Το ραντεβού θα καταχωριστεί ως ολοκληρωμένο.",
    button: "Ολοκλήρωση",
  },
  CANCELLED: {
    title: "Ακύρωση ραντεβού",
    description:
      "Το ραντεβού θα ακυρωθεί από τον administrator και το slot θα ελευθερωθεί.",
    button: "Ακύρωση",
  },
  NO_SHOW: {
    title: "Σήμανση ως no-show",
    description:
      "Το ραντεβού θα καταχωριστεί ως μη προσέλευση.",
    button: "Καταχώριση no-show",
  },
};

function AdminStatusModal({
  appointment,
  status,
  isPending,
  error,
  onClose,
  onConfirm,
}: {
  appointment: AdminAppointment;
  status: UpdateAdminAppointmentStatus;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const action =
    adminStatusActionLabels[status];

  const formattedDate =
    new Intl.DateTimeFormat("el-GR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(
      new Date(
        appointment.localStartsAt,
      ),
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <HistoryIcon className="size-6" />
        </div>

        <h2 className="mt-6 font-serif text-3xl text-slate-900">
          {action.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {action.description}
        </p>

        <div className="mt-5 rounded-2xl bg-gray-50 p-4">
          <p className="font-semibold text-slate-800">
            {appointment.customer.name}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {appointment.service.name} με{" "}
            {appointment.barber.name}
          </p>

          <p className="mt-3 text-sm font-medium text-slate-700">
            {formattedDate}
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error instanceof ApiError
              ? error.message
              : "Δεν ήταν δυνατή η ενημέρωση του ραντεβού."}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Επιστροφή
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}

            {action.button}
          </button>
        </div>
      </div>
    </div>
  );
}

function getCancelledByLabel(
  cancelledBy:
    | "CUSTOMER"
    | "BARBER"
    | "ADMIN"
    | "SYSTEM",
) {
  const labels = {
    CUSTOMER: "τον πελάτη",
    BARBER: "τον barber",
    ADMIN: "τον administrator",
    SYSTEM: "το σύστημα",
  };

  return labels[cancelledBy];
}

const adminStatusLabels: Record<
  AdminAppointmentStatus,
  string
> = {
  PENDING: "Σε αναμονή",
  CONFIRMED: "Επιβεβαιωμένο",
  COMPLETED: "Ολοκληρώθηκε",
  CANCELLED: "Ακυρώθηκε",
  NO_SHOW: "No-show",
};

const adminStatusClasses: Record<
  AdminAppointmentStatus,
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

function AdminStatusBadge({
  status,
}: {
  status: AdminAppointmentStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        adminStatusClasses[status],
      ].join(" ")}
    >
      {adminStatusLabels[status]}
    </span>
  );
}

function OverviewLoading() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({
        length: 8,
      }).map((_, index) => (
        <div
          key={index}
          className="min-h-40 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
        />
      ))}
    </div>
  );
}

function AppointmentsLoading() {
  return (
    <div className="mt-6 grid gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="min-h-40 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
        />
      ))}
    </div>
  );
}