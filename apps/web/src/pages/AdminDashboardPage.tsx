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
  ListChecksIcon,
  UserCogIcon,
  PlusIcon,
  PencilIcon,
  PowerIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/api-client";
import type {
  AdminAppointment,
  AdminAppointmentStatus,
} from "../api/admin.api";
import type {
  AdminService,
  AdminServiceInput,
} from "../api/admin-services.api";
import { useAuth } from "../auth/useAuth";
import { useAdminAppointments } from "../hooks/useAdminAppointments";
import { useAdminOverview } from "../hooks/useAdminOverview";
import { useBarbers } from "../hooks/useBarbers";
import {
  useUpdateAdminAppointmentStatus,
} from "../hooks/useUpdateAdminAppointmentStatus";
import { useAdminServices } from "../hooks/useAdminServices";
import { useCreateAdminService } from "../hooks/useCreateAdminService";
import { useUpdateAdminService } from "../hooks/useUpdateAdminService";
import { AdminBarbersPanel } from "../components/AdminBarbersPanel";

import type {
  UpdateAdminAppointmentStatus,
} from "../api/admin.api";

type AdminDashboardTab =
  | "overview"
  | "appointments"
  | "services"
  | "barbers";

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

  const [activeTab, setActiveTab] =
    useState<AdminDashboardTab>("overview");

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

        <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-sm">
          <AdminTabButton
            active={activeTab === "overview"}
            icon={<StoreIcon className="size-4" />}
            label="Επισκόπηση"
            onClick={() => setActiveTab("overview")}
          />

          <AdminTabButton
            active={activeTab === "appointments"}
            icon={<CalendarDaysIcon className="size-4" />}
            label="Ραντεβού"
            onClick={() => setActiveTab("appointments")}
          />

          <AdminTabButton
            active={activeTab === "services"}
            icon={<ListChecksIcon className="size-4" />}
            label="Υπηρεσίες"
            onClick={() => setActiveTab("services")}
          />

          <AdminTabButton
            active={activeTab === "barbers"}
            icon={<UserCogIcon className="size-4" />}
            label="Barbers"
            onClick={() => setActiveTab("barbers")}
          />
        </nav>

        {activeTab === "overview" &&
          overviewQuery.isPending && (
          <OverviewLoading />
        )}

        {activeTab === "overview" &&
          overviewQuery.isError && (
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

        {activeTab === "overview" &&
          overview && (
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

        {activeTab === "appointments" && (
        <section className="mt-8 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
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
        )}

        {activeTab === "services" && (
          <AdminServicesPanel />
        )}

        {activeTab === "barbers" && (
          <AdminBarbersPanel />
        )}
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


function AdminTabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "bg-slate-900 text-white"
          : "text-gray-500 hover:bg-gray-50 hover:text-slate-900",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

type ServiceModalState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      service: AdminService;
    }
  | null;

function AdminServicesPanel() {
  const servicesQuery = useAdminServices();
  const createServiceMutation =
    useCreateAdminService();
  const updateServiceMutation =
    useUpdateAdminService();

  const [modal, setModal] =
    useState<ServiceModalState>(null);

  const services =
    servicesQuery.data?.services ?? [];

  async function toggleService(
    service: AdminService,
  ) {
    try {
      await updateServiceMutation.mutateAsync({
        serviceId: service.id,
        data: {
          active: !service.active,
        },
      });
    } catch {
      // Το error εμφανίζεται κάτω από τη λίστα.
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
        <div className="size-3 rounded-full bg-red-400" />
        <div className="size-3 rounded-full bg-amber-400" />
        <div className="size-3 rounded-full bg-emerald-400" />

        <div className="mx-4 h-5 max-w-sm flex-1 rounded-md bg-white/80" />

        <span className="hidden text-xs font-medium text-gray-400 sm:block">
          Διαχείριση υπηρεσιών
        </span>
      </div>

      <div className="bg-[#f7f7f7] p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl text-slate-900">
              Υπηρεσίες
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Δημιούργησε και επεξεργάσου τις
              υπηρεσίες του καταστήματος. Η
              διάρκεια είναι σταθερή στα 30 λεπτά.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              createServiceMutation.reset();
              setModal({
                mode: "create",
              });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <PlusIcon className="size-4" />
            Νέα υπηρεσία
          </button>
        </div>

        {servicesQuery.isPending && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="min-h-48 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
              />
            ))}
          </div>
        )}

        {servicesQuery.isError && (
          <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">
              Δεν ήταν δυνατή η φόρτωση των
              υπηρεσιών.
            </p>

            <button
              type="button"
              onClick={() => {
                void servicesQuery.refetch();
              }}
              className="mt-3 text-sm font-semibold text-red-600 underline underline-offset-4"
            >
              Προσπάθησε ξανά
            </button>
          </div>
        )}

        {!servicesQuery.isPending &&
          !servicesQuery.isError &&
          services.length === 0 && (
            <div className="mt-7 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
              <ScissorsIcon className="mx-auto size-7 text-gray-300" />

              <h3 className="mt-4 font-serif text-2xl text-slate-900">
                Δεν υπάρχουν υπηρεσίες.
              </h3>
            </div>
          )}

        {!servicesQuery.isPending &&
          !servicesQuery.isError &&
          services.length > 0 && (
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <AdminServiceCard
                  key={service.id}
                  service={service}
                  isUpdating={
                    updateServiceMutation.isPending &&
                    updateServiceMutation.variables
                      ?.serviceId === service.id
                  }
                  onEdit={() => {
                    updateServiceMutation.reset();
                    setModal({
                      mode: "edit",
                      service,
                    });
                  }}
                  onToggle={() => {
                    void toggleService(service);
                  }}
                />
              ))}
            </div>
          )}

        {updateServiceMutation.error &&
          !modal && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {updateServiceMutation.error
                instanceof ApiError
                ? updateServiceMutation.error
                    .message
                : "Δεν ήταν δυνατή η ενημέρωση της υπηρεσίας."}
            </div>
          )}
      </div>

      {modal && (
        <AdminServiceModal
          mode={modal.mode}
          service={
            modal.mode === "edit"
              ? modal.service
              : null
          }
          isPending={
            modal.mode === "create"
              ? createServiceMutation.isPending
              : updateServiceMutation.isPending
          }
          error={
            modal.mode === "create"
              ? createServiceMutation.error
              : updateServiceMutation.error
          }
          onClose={() => {
            if (
              !createServiceMutation.isPending &&
              !updateServiceMutation.isPending
            ) {
              setModal(null);
              createServiceMutation.reset();
              updateServiceMutation.reset();
            }
          }}
          onSubmit={async (input) => {
            if (modal.mode === "create") {
              await createServiceMutation.mutateAsync(
                input,
              );
            } else {
              await updateServiceMutation.mutateAsync({
                serviceId: modal.service.id,
                data: input,
              });
            }

            setModal(null);
          }}
        />
      )}
    </section>
  );
}

function AdminServiceCard({
  service,
  isUpdating,
  onEdit,
  onToggle,
}: {
  service: AdminService;
  isUpdating: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <ScissorsIcon className="size-5" />
        </div>

        <span
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            service.active
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-100 text-gray-500",
          ].join(" ")}
        >
          {service.active
            ? "Ενεργή"
            : "Ανενεργή"}
        </span>
      </div>

      <h3 className="mt-5 font-serif text-2xl text-slate-900">
        {service.name}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
        {service.description ??
          "Δεν υπάρχει περιγραφή."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-gray-50 px-3 py-1.5 text-gray-500">
          30 λεπτά
        </span>

        <span className="rounded-full bg-gray-50 px-3 py-1.5 font-semibold text-slate-700">
          {currencyFormatter.format(
            service.price,
          )}
        </span>

        <span className="rounded-full bg-gray-50 px-3 py-1.5 text-gray-500">
          {service._count.barbers} barbers
        </span>

        <span className="rounded-full bg-gray-50 px-3 py-1.5 text-gray-500">
          {service._count.appointments} ραντεβού
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <PencilIcon className="size-4" />
          Επεξεργασία
        </button>

        <button
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          className={[
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
            service.active
              ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          ].join(" ")}
        >
          {isUpdating ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <PowerIcon className="size-4" />
          )}

          {service.active
            ? "Απενεργοποίηση"
            : "Ενεργοποίηση"}
        </button>
      </div>
    </article>
  );
}

function AdminServiceModal({
  mode,
  service,
  isPending,
  error,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  service: AdminService | null;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onSubmit: (
    input: AdminServiceInput,
  ) => Promise<void>;
}) {
  const [name, setName] = useState(
    service?.name ?? "",
  );

  const [description, setDescription] =
    useState(
      service?.description ?? "",
    );

  const [price, setPrice] = useState(
    service
      ? String(service.price)
      : "",
  );

  const [active, setActive] = useState(
    service?.active ?? true,
  );

  const numericPrice = Number(price);

  const formIsInvalid =
    name.trim().length < 2 ||
    price.trim() === "" ||
    !Number.isFinite(numericPrice) ||
    numericPrice < 0 ||
    numericPrice > 1000 ||
    description.length > 500;

  async function submitForm() {
    if (formIsInvalid) {
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description:
          description.trim() || null,
        price: numericPrice,
        active,
      });
    } catch {
      // Το error εμφανίζεται μέσα στο modal.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
          <ScissorsIcon className="size-6" />
        </div>

        <h2 className="mt-6 font-serif text-3xl text-slate-900">
          {mode === "create"
            ? "Νέα υπηρεσία"
            : "Επεξεργασία υπηρεσίας"}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Η διάρκεια της υπηρεσίας είναι
          σταθερή στα 30 λεπτά.
        </p>

        <div className="mt-6 grid gap-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Όνομα
            </span>

            <input
              type="text"
              value={name}
              maxLength={100}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="mt-2 h-12 w-full rounded-xl border border-black/10 px-4 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Περιγραφή
            </span>

            <textarea
              value={description}
              maxLength={500}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className="mt-2 min-h-28 w-full resize-y rounded-xl border border-black/10 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {description.length}/500
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Τιμή
            </span>

            <div className="mt-2 flex items-center rounded-xl border border-black/10 px-4 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
              <EuroIcon className="size-4 text-orange-500" />

              <input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target.value,
                  )
                }
                className="h-12 flex-1 bg-transparent px-3 text-sm text-slate-700 outline-none"
              />
            </div>
          </label>

          <div className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-gray-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Ενεργή υπηρεσία
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Εμφανίζεται στο booking flow.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() =>
                setActive((value) => !value)
              }
              className={[
                "relative h-7 w-12 rounded-full transition",
                active
                  ? "bg-orange-500"
                  : "bg-gray-200",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 size-5 rounded-full bg-white shadow-sm transition",
                  active
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error instanceof ApiError
              ? error.message
              : "Δεν ήταν δυνατή η αποθήκευση της υπηρεσίας."}
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
            disabled={
              isPending || formIsInvalid
            }
            onClick={() => {
              void submitForm();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && (
              <LoaderCircleIcon className="size-4 animate-spin" />
            )}

            {mode === "create"
              ? "Δημιουργία"
              : "Αποθήκευση"}
          </button>
        </div>
      </div>
    </div>
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