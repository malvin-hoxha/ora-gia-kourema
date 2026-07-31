import {
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  ScissorsIcon,
  UserRoundIcon,
} from "lucide-react";
import { useState } from "react";
import { ApiError } from "../api/api-client";
import type {
  AdminBarber,
  AdminBarberInput,
} from "../api/admin-barbers.api";
import { useAdminBarbers } from "../hooks/useAdminBarbers";
import { useAdminBarberUsers } from "../hooks/useAdminBarberUsers";
import { useAdminServices } from "../hooks/useAdminServices";
import { useCreateAdminBarber } from "../hooks/useCreateAdminBarber";
import { useUpdateAdminBarber } from "../hooks/useUpdateAdminBarber";
import {
  AdminBarberDetailsModal,
} from "./AdminBarberDetailsModal";

const emptyBarberForm: AdminBarberInput = {
  name: "",
  bio: null,
  imageUrl: null,
  active: true,
  userId: null,
  serviceIds: [],
};

export function AdminBarbersPanel() {
  const barbersQuery = useAdminBarbers();
  const usersQuery = useAdminBarberUsers();
  const servicesQuery = useAdminServices();
  const createMutation = useCreateAdminBarber();
  const updateMutation = useUpdateAdminBarber();
  const [
    selectedBarberId,
    setSelectedBarberId,
  ] = useState<string | null>(null);

  const [editingBarber, setEditingBarber] =
    useState<AdminBarber | null>(null);
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const barbers = barbersQuery.data?.barbers ?? [];

  async function toggleBarber(barber: AdminBarber) {
    try {
      await updateMutation.mutateAsync({
        barberId: barber.id,
        data: {
          active: !barber.active,
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
          Διαχείριση barbers
        </span>
      </div>

      <div className="bg-[#f7f7f7] p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl text-slate-900">
              Barbers
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Διαχειρίσου προφίλ, λογαριασμό BARBER,
              υπηρεσίες και ενεργή κατάσταση.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              createMutation.reset();
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <PlusIcon className="size-4" />
            Νέος barber
          </button>
        </div>

        {barbersQuery.isPending && (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="min-h-60 animate-pulse rounded-2xl border border-black/[0.06] bg-white"
              />
            ))}
          </div>
        )}

        {barbersQuery.isError && (
          <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">
              Δεν ήταν δυνατή η φόρτωση των barbers.
            </p>
            <button
              type="button"
              onClick={() => void barbersQuery.refetch()}
              className="mt-3 text-sm font-semibold text-red-600 underline underline-offset-4"
            >
              Προσπάθησε ξανά
            </button>
          </div>
        )}

        {!barbersQuery.isPending &&
          !barbersQuery.isError &&
          barbers.length === 0 && (
            <div className="mt-7 rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center">
              <UserRoundIcon className="mx-auto size-8 text-gray-300" />
              <h3 className="mt-4 font-serif text-2xl text-slate-900">
                Δεν υπάρχουν barbers.
              </h3>
            </div>
          )}

        {!barbersQuery.isPending &&
          !barbersQuery.isError &&
          barbers.length > 0 && (
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {barbers.map((barber) => (
                <article
                  key={barber.id}
                  className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    {barber.imageUrl ? (
                      <img
                        src={barber.imageUrl}
                        alt={barber.name}
                        className="size-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                        <UserRoundIcon className="size-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-2xl text-slate-900">
                          {barber.name}
                        </h3>
                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            barber.active
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-gray-100 text-gray-500",
                          ].join(" ")}
                        >
                          {barber.active ? "Ενεργός" : "Ανενεργός"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {barber.bio || "Δεν έχει προστεθεί βιογραφικό."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                    <p className="font-semibold text-slate-700">
                      {barber.user
                        ? barber.user.email
                        : "Δεν έχει συνδεθεί λογαριασμός BARBER"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {barber._count.workingHours}/7 ημέρες ωραρίου · {barber._count.appointments} ραντεβού
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {barber.services.length > 0 ? (
                      barber.services.map((service) => (
                        <span
                          key={service.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                        >
                          <ScissorsIcon className="size-3" />
                          {service.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">
                        Δεν έχουν ανατεθεί υπηρεσίες.
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBarberId(
                          barber.id,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                    >
                      <UserRoundIcon className="size-4" />
                      Λεπτομέρειες
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateMutation.reset();
                        setEditingBarber(barber);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      <PencilIcon className="size-4" />
                      Επεξεργασία
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void toggleBarber(barber);
                      }}
                      disabled={updateMutation.isPending}
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
                        barber.active
                          ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                      ].join(" ")}
                    >
                      {updateMutation.isPending &&
                      updateMutation.variables
                        ?.barberId === barber.id ? (
                        <LoaderCircleIcon className="size-4 animate-spin" />
                      ) : (
                        <PowerIcon className="size-4" />
                      )}

                      {barber.active
                        ? "Απενεργοποίηση"
                        : "Ενεργοποίηση"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

        {updateMutation.error && !editingBarber && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {updateMutation.error instanceof ApiError
              ? updateMutation.error.message
              : "Δεν ήταν δυνατή η ενημέρωση του barber."}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <AdminBarberModal
          title="Νέος barber"
          initialValue={emptyBarberForm}
          users={usersQuery.data ?? []}
          services={servicesQuery.data?.services ?? []}
          isPending={createMutation.isPending}
          error={createMutation.error}
          onClose={() => {
            if (!createMutation.isPending) {
              setIsCreateOpen(false);
              createMutation.reset();
            }
          }}
          onSubmit={async (input) => {
            await createMutation.mutateAsync(input);
            setIsCreateOpen(false);
          }}
        />
      )}

      {editingBarber && (
        <AdminBarberModal
          title="Επεξεργασία barber"
          initialValue={{
            name: editingBarber.name,
            bio: editingBarber.bio,
            imageUrl: editingBarber.imageUrl,
            active: editingBarber.active,
            userId: editingBarber.user?.id ?? null,
            serviceIds: editingBarber.services.map(
              (service) => service.id,
            ),
          }}
          currentBarberId={editingBarber.id}
          users={usersQuery.data ?? []}
          services={servicesQuery.data?.services ?? []}
          isPending={updateMutation.isPending}
          error={updateMutation.error}
          onClose={() => {
            if (!updateMutation.isPending) {
              setEditingBarber(null);
              updateMutation.reset();
            }
          }}
          onSubmit={async (input) => {
            await updateMutation.mutateAsync({
              barberId: editingBarber.id,
              data: input,
            });
            setEditingBarber(null);
          }}
        />
      )}

      {selectedBarberId && (
        <AdminBarberDetailsModal
          barberId={selectedBarberId}
          onClose={() => {
            setSelectedBarberId(null);
          }}
        />
      )}
    </section>
  );
}

function AdminBarberModal({
  title,
  initialValue,
  currentBarberId,
  users,
  services,
  isPending,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  initialValue: AdminBarberInput;
  currentBarberId?: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    barber: { id: string; name: string } | null;
  }>;
  services: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onSubmit: (input: AdminBarberInput) => Promise<void>;
}) {
  const [form, setForm] =
    useState<AdminBarberInput>(initialValue);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const availableUsers = users.filter(
    (user) =>
      !user.barber ||
      user.barber.id === currentBarberId,
  );

  function toggleService(serviceId: string) {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId],
    }));
  }

  async function submit() {
    if (form.name.trim().length < 2) {
      setLocalError("Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.");
      return;
    }

    setLocalError(null);

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        bio: form.bio?.trim() || null,
        imageUrl: form.imageUrl?.trim() || null,
      });
    } catch {
      // Το mutation error εμφανίζεται παρακάτω.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-5 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_30px_100px_rgba(15,23,42,0.25)]"
      >
        <h2 className="font-serif text-3xl text-slate-900">
          {title}
        </h2>

        <div className="mt-6 grid gap-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Όνομα</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Bio</span>
            <textarea
              value={form.bio ?? ""}
              maxLength={1000}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bio: event.target.value || null,
                }))
              }
              className="mt-2 min-h-28 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Image URL</span>
            <input
              type="url"
              value={form.imageUrl ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value || null,
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-black/10 px-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Λογαριασμός BARBER
            </span>
            <select
              value={form.userId ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  userId: event.target.value || null,
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
            >
              <option value="">Χωρίς συνδεδεμένο λογαριασμό</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Υπηρεσίες</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-gray-50 p-3"
                >
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="size-4 accent-orange-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {service.name}
                    {!service.active && " (ανενεργή)"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-gray-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Ενεργός</p>
              <p className="mt-1 text-xs text-gray-400">
                Εμφανίζεται στο booking όταν έχει ωράριο και υπηρεσίες.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
              className="size-5 accent-orange-500"
            />
          </label>
        </div>

        {(localError || error) && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {localError ??
              (error instanceof ApiError
                ? error.message
                : "Δεν ήταν δυνατή η αποθήκευση του barber.")}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-50"
          >
            Επιστροφή
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending && <LoaderCircleIcon className="size-4 animate-spin" />}
            Αποθήκευση
          </button>
        </div>
      </div>
    </div>
  );
}