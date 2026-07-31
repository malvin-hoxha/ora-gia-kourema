import {
  CalendarDaysIcon,
  Clock3Icon,
  LoaderCircleIcon,
  PencilIcon,
  ScissorsIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ApiError } from "../api/api-client";
import type { AdminAppointment, } from "../api/admin.api";
import { useAdminBarberDetails } from "../hooks/useAdminBarberDetails";
import { useAdminBarberWorkingHours } from "../hooks/useAdminBarberWorkingHours";
import { useUpdateAdminBarberWorkingHours } from "../hooks/useUpdateAdminBarberWorkingHours";
import type { AdminWorkingHoursInputItem } from "../api/admin-barbers.api";
import { useDeleteAdminBarberTimeOff, } from "../hooks/useDeleteAdminBarberTimeOff";

type AdminBarberDetailsModalProps = {
  barberId: string;
  onClose: () => void;
};

const currencyFormatter =
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  });

const weekDayLabels: Record<
  number,
  string
> = {
  0: "Κυριακή",
  1: "Δευτέρα",
  2: "Τρίτη",
  3: "Τετάρτη",
  4: "Πέμπτη",
  5: "Παρασκευή",
  6: "Σάββατο",
};

export function AdminBarberDetailsModal({
  barberId,
  onClose,
}: AdminBarberDetailsModalProps) {
  const detailsQuery =
    useAdminBarberDetails(barberId);

  const [isWorkingHoursOpen, setIsWorkingHoursOpen] =
    useState(false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-black/[0.07] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Barber details
            </p>

            <h2 className="mt-1 font-serif text-3xl text-slate-900">
              Αναλυτικά στοιχεία
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-black/10 text-gray-500 transition hover:bg-gray-50 hover:text-slate-900"
            aria-label="Κλείσιμο"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {detailsQuery.isPending && (
          <div className="flex min-h-96 items-center justify-center">
            <LoaderCircleIcon className="size-8 animate-spin text-orange-500" />
          </div>
        )}

        {detailsQuery.isError && (
          <div className="m-6 rounded-2xl border border-red-100 bg-red-50 p-8 text-center sm:m-8">
            <p className="font-semibold text-red-700">
              Δεν ήταν δυνατή η φόρτωση
              των στοιχείων.
            </p>

            <p className="mt-2 text-sm text-red-600">
              {detailsQuery.error instanceof
              ApiError
                ? detailsQuery.error.message
                : "Παρουσιάστηκε κάποιο σφάλμα."}
            </p>

            <button
              type="button"
              onClick={() => {
                void detailsQuery.refetch();
              }}
              className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
            >
              Προσπάθησε ξανά
            </button>
          </div>
        )}

        {detailsQuery.data && (
          <AdminBarberDetailsContent
            details={detailsQuery.data}
            onEditWorkingHours={() => {
              setIsWorkingHoursOpen(true);
            }}
          />
        )}
      </div>

      {isWorkingHoursOpen && (
        <AdminWorkingHoursModal
          barberId={barberId}
          onClose={() => {
            setIsWorkingHoursOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AdminBarberDetailsContent({
  details,
  onEditWorkingHours,
}: {
  details: NonNullable<
    ReturnType<
      typeof useAdminBarberDetails
    >["data"]
  >;
  onEditWorkingHours: () => void;
}) {
  const {
    barber,
    upcomingTimeOff,
    activeAppointments,
    counts,
  } = details;

  const deleteTimeOffMutation = useDeleteAdminBarberTimeOff();

  return (
    <div className="p-6 sm:p-8">
      <section className="flex flex-col justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {barber.imageUrl ? (
            <img
              src={barber.imageUrl}
              alt={barber.name}
              className="size-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
              <UserRoundIcon className="size-7" />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-3xl">
                {barber.name}
              </h3>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  barber.active
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-red-400/15 text-red-300",
                ].join(" ")}
              >
                {barber.active
                  ? "Ενεργός"
                  : "Ανενεργός"}
              </span>
            </div>

            {barber.bio && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {barber.bio}
              </p>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-300">
          {barber.user ? (
            <>
              <p className="font-semibold text-white">
                {barber.user.email}
              </p>

              {barber.user.phone && (
                <p className="mt-1">
                  {barber.user.phone}
                </p>
              )}
            </>
          ) : (
            <p>
              Δεν υπάρχει συνδεδεμένος
              λογαριασμός.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailsCountCard
          icon={
            <ScissorsIcon className="size-5" />
          }
          label="Υπηρεσίες"
          value={counts.services}
        />

        <DetailsCountCard
          icon={
            <Clock3Icon className="size-5" />
          }
          label="Εργάσιμες ημέρες"
          value={counts.workingDays}
        />

        <DetailsCountCard
          icon={
            <CalendarDaysIcon className="size-5" />
          }
          label="Επερχόμενες άδειες"
          value={counts.upcomingTimeOff}
        />

        <DetailsCountCard
          icon={
            <UserRoundIcon className="size-5" />
          }
          label="Ενεργά ραντεβού"
          value={counts.activeAppointments}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.07] p-5">
          <h3 className="font-serif text-2xl text-slate-900">
            Υπηρεσίες
          </h3>

          {barber.services.length === 0 ? (
            <EmptyMessage text="Δεν έχουν ανατεθεί υπηρεσίες." />
          ) : (
            <div className="mt-4 grid gap-3">
              {barber.services.map(
                (service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {service.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {
                          service.durationMinutes
                        }{" "}
                        λεπτά
                        {!service.active &&
                          " · Ανενεργή"}
                      </p>
                    </div>

                    <p className="font-semibold text-slate-900">
                      {currencyFormatter.format(
                        service.price,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/[0.07] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-2xl text-slate-900">
              Εβδομαδιαίο ωράριο
            </h3>

            <button
              type="button"
              onClick={onEditWorkingHours}
              className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              <PencilIcon className="size-4" />
              Επεξεργασία
            </button>
          </div>

          {barber.workingHours.length ===
          0 ? (
            <EmptyMessage text="Δεν έχει οριστεί ωράριο." />
          ) : (
            <div className="mt-4 grid gap-2">
              {barber.workingHours.map(
                (workingHour) => (
                  <div
                    key={workingHour.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {weekDayLabels[
                        workingHour
                          .dayOfWeek
                      ] ??
                        `Ημέρα ${workingHour.dayOfWeek}`}
                    </span>

                    <span
                      className={
                        workingHour.active
                          ? "text-slate-700"
                          : "text-gray-400"
                      }
                    >
                      {workingHour.active
                        ? `${workingHour.startTime} – ${workingHour.endTime}`
                        : "Κλειστά"}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/[0.07] p-5">
        <h3 className="font-serif text-2xl text-slate-900">
          Επερχόμενες άδειες
        </h3>

        {upcomingTimeOff.length === 0 ? (
          <EmptyMessage text="Δεν υπάρχουν επερχόμενες άδειες." />
        ) : (
          <div className="mt-4 grid gap-3">
            {upcomingTimeOff.map(
              (timeOff) => (
                <div
                  key={timeOff.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold text-amber-800">
                      {formatDateTime(
                        timeOff.localStartsAt,
                      )}
                      {" – "}
                      {formatDateTime(
                        timeOff.localEndsAt,
                      )}
                    </p>

                    {timeOff.reason && (
                      <p className="mt-2 text-sm text-amber-700">
                        {timeOff.reason}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      deleteTimeOffMutation.isPending
                    }
                    onClick={() => {
                      const confirmed =
                        window.confirm(
                          "Να διαγραφεί αυτή η άδεια; Τα slots θα γίνουν ξανά διαθέσιμα.",
                        );

                      if (!confirmed) {
                        return;
                      }

                      void deleteTimeOffMutation.mutateAsync({
                        barberId: barber.id,
                        timeOffId: timeOff.id,
                      });
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteTimeOffMutation.isPending &&
                    deleteTimeOffMutation.variables
                      ?.timeOffId === timeOff.id ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}

                    Διαγραφή
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {deleteTimeOffMutation.error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {deleteTimeOffMutation.error instanceof
            ApiError
              ? deleteTimeOffMutation.error.message
              : "Δεν ήταν δυνατή η διαγραφή της άδειας."}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-black/[0.07] p-5">
        <h3 className="font-serif text-2xl text-slate-900">
          Ενεργά ραντεβού
        </h3>

        {activeAppointments.length === 0 ? (
          <EmptyMessage text="Δεν υπάρχουν ενεργά μελλοντικά ραντεβού." />
        ) : (
          <div className="mt-4 grid gap-3">
            {activeAppointments.map(
              (appointment) => (
                <ActiveAppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailsCountCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
        {icon}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-serif text-3xl text-slate-900">
        {value}
      </p>
    </article>
  );
}

function ActiveAppointmentRow({
  appointment,
}: {
  appointment: AdminAppointment;
}) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-semibold text-slate-800">
          {appointment.customer.name}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {appointment.service.name}
        </p>
      </div>

      <div className="text-sm sm:text-right">
        <p className="font-medium text-slate-700">
          {formatDateTime(
            appointment.localStartsAt,
          )}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          {getAppointmentStatusLabel(
            appointment.status,
          )}
        </p>
      </div>
    </article>
  );
}

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <p className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
      {text}
    </p>
  );
}


function AdminWorkingHoursModal({
  barberId,
  onClose,
}: {
  barberId: string;
  onClose: () => void;
}) {
  const workingHoursQuery =
    useAdminBarberWorkingHours(barberId);

  const updateMutation =
    useUpdateAdminBarberWorkingHours();

  const [form, setForm] = useState<
    AdminWorkingHoursInputItem[] | null
  >(null);

  const workingHours =
    form ??
    buildWorkingHoursForm(
      workingHoursQuery.data
        ?.workingHours ?? [],
    );

  function updateDay(
    dayOfWeek: number,
    updates: Partial<
      AdminWorkingHoursInputItem
    >,
  ) {
    setForm(
      workingHours.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              ...updates,
            }
          : day,
      ),
    );
  }

  async function saveWorkingHours() {
    try {
      await updateMutation.mutateAsync({
        barberId,
        workingHours,
      });

      onClose();
    } catch {
      // Το mutation error εμφανίζεται στο modal.
    }
  }

  const formIsInvalid =
    workingHours.some(
      (day) =>
        day.active &&
        (!day.startTime ||
          !day.endTime ||
          day.startTime >= day.endTime),
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/[0.07] bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.3)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Working hours
            </p>

            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Επεξεργασία ωραρίου
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Όρισε τις ενεργές ημέρες και το
              ωράριο του barber.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
            aria-label="Κλείσιμο"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {workingHoursQuery.isPending && (
          <div className="flex min-h-72 items-center justify-center">
            <LoaderCircleIcon className="size-8 animate-spin text-orange-500" />
          </div>
        )}

        {workingHoursQuery.isError && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">
              Δεν ήταν δυνατή η φόρτωση του
              ωραρίου.
            </p>

            <button
              type="button"
              onClick={() => {
                void workingHoursQuery.refetch();
              }}
              className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4"
            >
              Προσπάθησε ξανά
            </button>
          </div>
        )}

        {!workingHoursQuery.isPending &&
          !workingHoursQuery.isError && (
            <div className="mt-7 grid gap-3">
              {workingHours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="rounded-2xl border border-black/[0.07] bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <label className="flex min-w-40 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={day.active}
                        onChange={(event) => {
                          const active =
                            event.target.checked;

                          updateDay(
                            day.dayOfWeek,
                            {
                              active,
                              startTime: active
                                ? day.startTime ??
                                  "09:00"
                                : null,
                              endTime: active
                                ? day.endTime ??
                                  "17:00"
                                : null,
                            },
                          );
                        }}
                        className="size-5 accent-orange-500"
                      />

                      <span className="font-semibold text-slate-800">
                        {
                          weekDayLabels[
                            day.dayOfWeek
                          ]
                        }
                      </span>
                    </label>

                    <div className="grid flex-1 grid-cols-2 gap-3">
                      <label>
                        <span className="text-xs font-medium text-gray-500">
                          Έναρξη
                        </span>

                        <input
                          type="time"
                          value={
                            day.startTime ?? ""
                          }
                          disabled={!day.active}
                          onChange={(event) => {
                            updateDay(
                              day.dayOfWeek,
                              {
                                startTime:
                                  event.target
                                    .value ||
                                  null,
                              },
                            );
                          }}
                          className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-gray-500">
                          Λήξη
                        </span>

                        <input
                          type="time"
                          value={
                            day.endTime ?? ""
                          }
                          disabled={!day.active}
                          onChange={(event) => {
                            updateDay(
                              day.dayOfWeek,
                              {
                                endTime:
                                  event.target
                                    .value ||
                                  null,
                              },
                            );
                          }}
                          className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </label>
                    </div>
                  </div>

                  {day.active &&
                    day.startTime &&
                    day.endTime &&
                    day.startTime >=
                      day.endTime && (
                      <p className="mt-3 text-sm text-red-600">
                        Η ώρα λήξης πρέπει να είναι
                        μετά την ώρα έναρξης.
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}

        {updateMutation.error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {updateMutation.error instanceof
            ApiError
              ? updateMutation.error.message
              : "Δεν ήταν δυνατή η αποθήκευση του ωραρίου."}
          </div>
        )}

        {!workingHoursQuery.isPending &&
          !workingHoursQuery.isError && (
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={
                  updateMutation.isPending
                }
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Επιστροφή
              </button>

              <button
                type="button"
                onClick={() => {
                  void saveWorkingHours();
                }}
                disabled={
                  updateMutation.isPending ||
                  formIsInvalid
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}

                Αποθήκευση ωραρίου
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

function buildWorkingHoursForm(
  existingWorkingHours: Array<{
    dayOfWeek: number;
    startTime: string | null;
    endTime: string | null;
    active: boolean;
  }>,
): AdminWorkingHoursInputItem[] {
  return Array.from(
    {
      length: 7,
    },
    (_, dayOfWeek) => {
      const existing =
        existingWorkingHours.find(
          (workingHour) =>
            workingHour.dayOfWeek ===
            dayOfWeek,
        );

      if (existing) {
        return {
          dayOfWeek,
          startTime:
            existing.startTime,
          endTime: existing.endTime,
          active: existing.active,
        };
      }

      return {
        dayOfWeek,
        startTime: null,
        endTime: null,
        active: false,
      };
    },
  );
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "el-GR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function getAppointmentStatusLabel(
  status: AdminAppointment["status"],
) {
  const labels: Record<
    AdminAppointment["status"],
    string
  > = {
    PENDING: "Σε αναμονή",
    CONFIRMED: "Επιβεβαιωμένο",
    COMPLETED: "Ολοκληρωμένο",
    CANCELLED: "Ακυρωμένο",
    NO_SHOW: "No-show",
  };

  return labels[status];
}