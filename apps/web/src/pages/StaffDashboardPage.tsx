import { CalendarDaysIcon, CheckCircle2Icon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon,
  Clock3Icon, HistoryIcon, LoaderCircleIcon, MailIcon, PhoneIcon, ScissorsIcon, UserRoundIcon, XCircleIcon,
  CalendarClockIcon, SaveIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/api-client";
import type { StaffAppointment, StaffAppointmentStatus, UpdateAppointmentStatus, WorkingDay} from "../api/staff.api";
import { useAuth } from "../auth/useAuth";
import { useStaffAppointments } from "../hooks/useStaffAppointments";
import { useUpdateStaffAppointmentStatus } from "../hooks/useUpdateStaffAppointmentStatus";
import { useStaffWorkingHours } from "../hooks/useStaffWorkingHours";
import { useUpdateStaffWorkingHours } from "../hooks/useUpdateStaffWorkingHours";

type StatusFilter = | "" | StaffAppointmentStatus;

type StaffDashboardTab =
  | "appointments"
  | "working-hours";

const currencyFormatter = new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  });

function toDateInputValue(date: Date) {
  const year = date.getFullYear();

  const month = String( date.getMonth() + 1, ).padStart(2, "0");

  const day = String( date.getDate(), ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays( dateString: string, amount: number,
) {
  const date = new Date( `${dateString}T12:00:00`, );

  date.setDate( date.getDate() + amount,  );

  return toDateInputValue(date);
}

function formatSelectedDate( dateString: string,) {
  return new Intl.DateTimeFormat(
    "el-GR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format( new Date(`${dateString}T12:00:00`), );
}

export function StaffDashboardPage() {
  const { user, logout } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()), );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [activeTab, setActiveTab] = useState<StaffDashboardTab>( "appointments",);

  const [ pendingStatusChange, setPendingStatusChange, ] = useState<{ appointment: StaffAppointment;
    status: UpdateAppointmentStatus;
  } | null>(null);

  const appointmentsQuery =
    useStaffAppointments({
      date: selectedDate,
      status: statusFilter,
    });

  const updateStatusMutation =
    useUpdateStaffAppointmentStatus();

  const appointments = appointmentsQuery.data?.appointments ?? [];

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
        className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,transparent_70%)]"
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
                <UserRoundIcon className="size-4" />
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>

                <p className="text-xs text-gray-400">
                  {user?.role === "ADMIN"
                    ? "Administrator"
                    : "Barber"}
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
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
                <ScissorsIcon className="size-3.5" />
                Staff dashboard
              </div>

              <h1 className="mt-6 font-serif text-4xl tracking-[-0.035em] text-slate-900 sm:text-5xl">
                Ημερήσιο πρόγραμμα.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Δες τα ραντεβού της ημέρας και
                ενημέρωσε την κατάστασή τους.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.07] bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                Επιλεγμένη ημέρα
              </p>

              <p className="mt-2 font-serif text-xl capitalize text-slate-900">
                {formatSelectedDate(
                  selectedDate,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 max-w-sm flex-1 rounded-md bg-white/80" />

            <span className="hidden text-xs font-medium text-gray-400 sm:block">
              Διαχείριση ραντεβού
            </span>
          </div>

          <div className="border-b border-black/[0.06] bg-white px-4 py-4 sm:px-7">
            <div className="inline-flex rounded-full border border-black/[0.07] bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("appointments")}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  activeTab === "appointments"
                    ? "bg-slate-900 text-white"
                    : "text-gray-500 hover:text-slate-900",
                ].join(" ")}
              >
                <CalendarDaysIcon className="size-4" />
                Ραντεβού
              </button>

              {user?.role === "BARBER" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("working-hours")}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    activeTab === "working-hours"
                      ? "bg-slate-900 text-white"
                      : "text-gray-500 hover:text-slate-900",
                  ].join(" ")}
                >
                  <CalendarClockIcon className="size-4" />
                  Ωράριο
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#f7f7f7] p-4 sm:p-7">
            {activeTab === "appointments" && (
              <>
                <StaffFilters
                  selectedDate={selectedDate}
                  statusFilter={statusFilter}
                  onDateChange={setSelectedDate}
                  onStatusChange={setStatusFilter}
                />

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Ραντεβού ημέρας
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {appointments.length} συνολικά
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
                  <StaffLoadingState />
                )}

                {appointmentsQuery.isError && (
                  <StaffErrorState
                    onRetry={() => {
                      void appointmentsQuery.refetch();
                    }}
                  />
                )}

                {!appointmentsQuery.isPending &&
                  !appointmentsQuery.isError &&
                  appointments.length === 0 && (
                    <StaffEmptyState date={selectedDate} />
                  )}

                {!appointmentsQuery.isPending &&
                  !appointmentsQuery.isError &&
                  appointments.length > 0 && (
                    <div className="mt-6 grid gap-4">
                      {appointments.map((appointment) => (
                        <StaffAppointmentCard
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
                      ))}
                    </div>
                  )}
              </>
            )}

            {activeTab === "working-hours" &&
              user?.role === "BARBER" && (
                <WorkingHoursPanel />
              )}
          </div>
        </section>
      </div>

      {pendingStatusChange && (
        <StatusChangeModal
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
            if (
              !updateStatusMutation.isPending
            ) {
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


const workingDayLabels: Record<number, string> = {
  0: "Κυριακή",
  1: "Δευτέρα",
  2: "Τρίτη",
  3: "Τετάρτη",
  4: "Πέμπτη",
  5: "Παρασκευή",
  6: "Σάββατο",
};

function WorkingHoursPanel() {
  const workingHoursQuery = useStaffWorkingHours();
  const updateWorkingHoursMutation =
    useUpdateStaffWorkingHours();

  const [draftWorkingHours, setDraftWorkingHours] =
    useState<WorkingDay[] | null>(null);

  const workingHours =
    draftWorkingHours ??
    workingHoursQuery.data ??
    [];

  const hasChanges = draftWorkingHours !== null;

  function updateWorkingDay(
    dayOfWeek: number,
    changes: Partial<WorkingDay>,
  ) {
    const source =
      draftWorkingHours ??
      workingHoursQuery.data ??
      [];

    setDraftWorkingHours(
      source.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              ...changes,
            }
          : day,
      ),
    );

    updateWorkingHoursMutation.reset();
  }

  function toggleWorkingDay(day: WorkingDay) {
    if (day.active) {
      updateWorkingDay(day.dayOfWeek, {
        active: false,
        startTime: null,
        endTime: null,
      });

      return;
    }

    updateWorkingDay(day.dayOfWeek, {
      active: true,
      startTime: "09:00",
      endTime: "18:00",
    });
  }

  function hasInvalidWorkingHours() {
    return workingHours.some(
      (day) =>
        day.active &&
        (!day.startTime ||
          !day.endTime ||
          day.startTime >= day.endTime),
    );
  }

  async function saveWorkingHours() {
    if (
      !draftWorkingHours ||
      hasInvalidWorkingHours()
    ) {
      return;
    }

    try {
      await updateWorkingHoursMutation.mutateAsync(
        draftWorkingHours,
      );

      setDraftWorkingHours(null);
    } catch {
      // The mutation error is displayed below.
    }
  }

  if (workingHoursQuery.isPending) {
    return <WorkingHoursLoading />;
  }

  if (workingHoursQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">
          Δεν ήταν δυνατή η φόρτωση του ωραρίου.
        </p>

        <button
          type="button"
          onClick={() => {
            void workingHoursQuery.refetch();
          }}
          className="mt-4 text-sm font-semibold text-red-600 underline underline-offset-4"
        >
          Προσπάθησε ξανά
        </button>
      </div>
    );
  }

  const invalidWorkingHours =
    hasInvalidWorkingHours();

  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-serif text-3xl text-slate-900">
            Εβδομαδιαίο ωράριο
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
            Επίλεξε τις ημέρες που εργάζεσαι και
            όρισε την ώρα έναρξης και λήξης.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasChanges && (
            <button
              type="button"
              onClick={() => {
                setDraftWorkingHours(null);
                updateWorkingHoursMutation.reset();
              }}
              disabled={
                updateWorkingHoursMutation.isPending
              }
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Ακύρωση αλλαγών
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void saveWorkingHours();
            }}
            disabled={
              !hasChanges ||
              invalidWorkingHours ||
              updateWorkingHoursMutation.isPending
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateWorkingHoursMutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}

            Αποθήκευση
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-3">
        {workingHours.map((day) => (
          <WorkingDayRow
            key={day.dayOfWeek}
            day={day}
            onToggle={() =>
              toggleWorkingDay(day)
            }
            onChange={(changes) =>
              updateWorkingDay(
                day.dayOfWeek,
                changes,
              )
            }
          />
        ))}
      </div>

      {invalidWorkingHours && (
        <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Σε κάθε εργάσιμη ημέρα η ώρα λήξης πρέπει
          να είναι αργότερα από την ώρα έναρξης.
        </div>
      )}

      {updateWorkingHoursMutation.isSuccess &&
        !hasChanges && (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Το ωράριο αποθηκεύτηκε επιτυχώς.
          </div>
        )}

      {updateWorkingHoursMutation.error && (
        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {updateWorkingHoursMutation.error
            instanceof ApiError
            ? updateWorkingHoursMutation.error
                .message
            : "Δεν ήταν δυνατή η ενημέρωση του ωραρίου."}
        </div>
      )}
    </section>
  );
}

type WorkingDayRowProps = {
  day: WorkingDay;
  onToggle: () => void;
  onChange: (
    changes: Partial<WorkingDay>,
  ) => void;
};

function WorkingDayRow({
  day,
  onToggle,
  onChange,
}: WorkingDayRowProps) {
  return (
    <div className="grid gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={day.active}
          onClick={onToggle}
          className={[
            "relative h-7 w-12 rounded-full transition",
            day.active
              ? "bg-orange-500"
              : "bg-gray-200",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-1 size-5 rounded-full bg-white shadow-sm transition",
              day.active
                ? "left-6"
                : "left-1",
            ].join(" ")}
          />
        </button>

        <div>
          <p className="font-semibold text-slate-800">
            {workingDayLabels[day.dayOfWeek]}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {day.active
              ? "Εργάσιμη ημέρα"
              : "Κλειστά"}
          </p>
        </div>
      </div>

      {day.active ? (
        <div className="flex flex-wrap items-center gap-3">
          <TimeField
            label="Έναρξη"
            value={day.startTime ?? "09:00"}
            onChange={(startTime) =>
              onChange({ startTime })
            }
          />

          <span className="hidden pt-6 text-gray-300 sm:block">
            —
          </span>

          <TimeField
            label="Λήξη"
            value={day.endTime ?? "18:00"}
            onChange={(endTime) =>
              onChange({ endTime })
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/10 bg-gray-50 px-4 py-3 text-sm text-gray-400">
          Δεν υπάρχουν διαθέσιμες ώρες.
        </div>
      )}

      <div
        className={[
          "rounded-full border px-3 py-1.5 text-center text-xs font-semibold",
          day.active
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-gray-200 bg-gray-100 text-gray-500",
        ].join(" ")}
      >
        {day.active
          ? `${day.startTime ?? "--:--"} – ${
              day.endTime ?? "--:--"
            }`
          : "Κλειστά"}
      </div>
    </div>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimeField({
  label,
  value,
  onChange,
}: TimeFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-400">
        {label}
      </span>

      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
        <Clock3Icon className="size-4 text-orange-500" />

        <input
          type="time"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-10 bg-transparent text-sm font-medium text-slate-700 outline-none"
        />
      </div>
    </label>
  );
}

function WorkingHoursLoading() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3, 4, 5, 6].map(
        (day) => (
          <div
            key={day}
            className="min-h-24 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
          />
        ),
      )}
    </div>
  );
}

type StaffFiltersProps = {
  selectedDate: string;
  statusFilter: StatusFilter;
  onDateChange: (date: string) => void;
  onStatusChange: (
    status: StatusFilter,
  ) => void;
};

const statusFilterOptions: Array<{
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

function StaffFilters({
  selectedDate,
  statusFilter,
  onDateChange,
  onStatusChange,
}: StaffFiltersProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Ημερομηνία
          </label>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onDateChange(
                  addDays(
                    selectedDate,
                    -1,
                  ),
                )
              }
              className="flex size-11 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              aria-label="Προηγούμενη ημέρα"
            >
              <ChevronLeftIcon className="size-4" />
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
              <CalendarDaysIcon className="size-4 text-orange-500" />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  onDateChange(
                    event.target.value,
                  )
                }
                className="h-11 bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                onDateChange(
                  addDays(
                    selectedDate,
                    1,
                  ),
                )
              }
              className="flex size-11 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              aria-label="Επόμενη ημέρα"
            >
              <ChevronRightIcon className="size-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                onDateChange(
                  toDateInputValue(
                    new Date(),
                  ),
                )
              }
              className="hidden h-11 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-gray-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:block"
            >
              Σήμερα
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            Κατάσταση
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {statusFilterOptions.map(
              (option) => {
                const isActive =
                  statusFilter ===
                  option.value;

                return (
                  <button
                    key={
                      option.value ||
                      "ALL"
                    }
                    type="button"
                    onClick={() =>
                      onStatusChange(
                        option.value,
                      )
                    }
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-black/[0.08] bg-white text-gray-500 hover:border-orange-200 hover:text-orange-600",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type StaffAppointmentCardProps = {
  appointment: StaffAppointment;
  onStatusChange: (
    status: UpdateAppointmentStatus,
  ) => void;
};

function StaffAppointmentCard({
  appointment,
  onStatusChange,
}: StaffAppointmentCardProps) {
  const startDate = new Date(
    appointment.localStartsAt,
  );

  const endDate = new Date(
    appointment.localEndsAt,
  );

  const startTime =
    new Intl.DateTimeFormat("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(startDate);

  const endTime =
    new Intl.DateTimeFormat("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(endDate);

  return (
    <article className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition hover:border-orange-100 hover:shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="grid lg:grid-cols-[150px_1fr_auto]">
        <div className="flex items-center gap-4 border-b border-black/[0.06] bg-slate-900 px-5 py-5 text-white lg:flex-col lg:items-start lg:justify-center lg:border-b-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Clock3Icon className="size-5" />
          </div>

          <div>
            <p className="font-serif text-2xl">
              {startTime}
            </p>

            <p className="mt-1 text-xs text-white/55">
              έως {endTime}
            </p>
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-2xl text-slate-900">
              {appointment.service.name}
            </h2>

            <StaffStatusBadge
              status={
                appointment.status
              }
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InformationItem
              icon={
                <UserRoundIcon className="size-4" />
              }
              label="Πελάτης"
              value={
                appointment.customer.name
              }
            />

            <InformationItem
              icon={
                <PhoneIcon className="size-4" />
              }
              label="Τηλέφωνο"
              value={
                appointment.customer
                  .phone ?? "Δεν έχει δοθεί"
              }
            />

            <InformationItem
              icon={
                <MailIcon className="size-4" />
              }
              label="Email"
              value={
                appointment.customer.email
              }
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="rounded-full bg-gray-50 px-3 py-1.5">
              {
                appointment.service
                  .durationMinutes
              }{" "}
              λεπτά
            </span>

            <span className="rounded-full bg-gray-50 px-3 py-1.5 font-semibold text-slate-700">
              {currencyFormatter.format(
                appointment.service.price,
              )}
            </span>
          </div>

          {appointment.notes && (
            <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">
                Σημειώσεις
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] p-5 lg:w-56 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0">
          <StatusActions
            appointment={appointment}
            onStatusChange={
              onStatusChange
            }
          />
        </div>
      </div>
    </article>
  );
}

type StatusActionsProps = {
  appointment: StaffAppointment;
  onStatusChange: (
    status: UpdateAppointmentStatus,
  ) => void;
};

function StatusActions({
  appointment,
  onStatusChange,
}: StatusActionsProps) {
  if (
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED" ||
    appointment.status === "NO_SHOW"
  ) {
    return (
      <p className="text-center text-sm text-gray-400">
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <CheckCircle2Icon className="size-4" />
          Επιβεβαίωση
        </button>

        <button
          type="button"
          onClick={() =>
            onStatusChange("CANCELLED")
          }
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          <XCircleIcon className="size-4" />
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
        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <CheckCircle2Icon className="size-4" />
        Ολοκλήρωση
      </button>

      <button
        type="button"
        onClick={() =>
          onStatusChange("NO_SHOW")
        }
        className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
      >
        <CircleAlertIcon className="size-4" />
        No-show
      </button>

      <button
        type="button"
        onClick={() =>
          onStatusChange("CANCELLED")
        }
        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        <XCircleIcon className="size-4" />
        Ακύρωση
      </button>
    </>
  );
}

const staffStatusLabels: Record<
  StaffAppointmentStatus,
  string
> = {
  PENDING: "Σε αναμονή",
  CONFIRMED: "Επιβεβαιωμένο",
  COMPLETED: "Ολοκληρώθηκε",
  CANCELLED: "Ακυρώθηκε",
  NO_SHOW: "No-show",
};

const staffStatusClasses: Record<
  StaffAppointmentStatus,
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

function StaffStatusBadge({
  status,
}: {
  status: StaffAppointmentStatus;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        staffStatusClasses[status],
      ].join(" ")}
    >
      {staffStatusLabels[status]}
    </span>
  );
}

function InformationItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}


const statusActionLabels: Record<
  UpdateAppointmentStatus,
  {
    title: string;
    description: string;
    button: string;
  }
> = {
  CONFIRMED: {
    title: "Επιβεβαίωση ραντεβού",
    description:
      "Το ραντεβού θα εμφανίζεται ως επιβεβαιωμένο και στον πελάτη.",
    button: "Επιβεβαίωση",
  },

  COMPLETED: {
    title: "Ολοκλήρωση ραντεβού",
    description:
      "Το ραντεβού θα μεταφερθεί στο ιστορικό ως ολοκληρωμένο.",
    button: "Ολοκλήρωση",
  },

  CANCELLED: {
    title: "Ακύρωση ραντεβού",
    description:
      "Το appointment θα ακυρωθεί και το slot θα γίνει ξανά διαθέσιμο.",
    button: "Ακύρωση",
  },

  NO_SHOW: {
    title: "Σήμανση ως no-show",
    description:
      "Το ραντεβού θα καταγραφεί ως μη προσέλευση πελάτη.",
    button: "Καταχώριση no-show",
  },
};

type StatusChangeModalProps = {
  appointment: StaffAppointment;
  status: UpdateAppointmentStatus;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onConfirm: () => void;
};

function StatusChangeModal({
  appointment,
  status,
  isPending,
  error,
  onClose,
  onConfirm,
}: StatusChangeModalProps) {
  const action =
    statusActionLabels[status];

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
            {appointment.service.name}
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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

function StaffLoadingState() {
  return (
    <div className="mt-6 grid gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="min-h-44 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
        />
      ))}
    </div>
  );
}

function StaffErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
      <p className="font-semibold text-red-700">
        Δεν ήταν δυνατή η φόρτωση των ραντεβού.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 text-sm font-semibold text-red-600 underline underline-offset-4"
      >
        Προσπάθησε ξανά
      </button>
    </div>
  );
}

function StaffEmptyState({
  date,
}: {
  date: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        <CalendarDaysIcon className="size-6" />
      </div>

      <h2 className="mt-5 font-serif text-2xl text-slate-900">
        Δεν υπάρχουν ραντεβού.
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Δεν βρέθηκαν appointments για{" "}
        <span className="font-semibold text-slate-700">
          {formatSelectedDate(date)}
        </span>
        .
      </p>
    </div>
  );
}