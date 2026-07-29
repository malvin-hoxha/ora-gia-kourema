import { ArrowLeftIcon, ArrowRightIcon, CalendarDaysIcon, CheckIcon, Clock3Icon, LoaderCircleIcon, ScissorsIcon, UserRoundIcon,} from "lucide-react";

import {useMemo,useState,} from "react";

import { useMutation, useQueryClient,} from "@tanstack/react-query";

import { Link, useNavigate,} from "react-router-dom";

import type { AvailableSlot } from "../api/availability.api";

import { createAppointment, type CreatedAppointment,} from "../api/appointments.api";

import { ApiError } from "../api/api-client";
import type { Barber } from "../api/barbers.api";
import type { Service } from "../api/services.api";
import { useAvailability } from "../hooks/useAvailability";
import { useBarbers } from "../hooks/useBarbers";
import { useServices } from "../hooks/useServices";

type BookingStep = | "service" | "barber" | "date" | "confirmation";

const steps: Array<{ id: BookingStep; label: string;}> = [
  {
    id: "service",
    label: "Υπηρεσία",
  },
  {
    id: "barber",
    label: "Barber",
  },
  {
    id: "date",
    label: "Ημερομηνία",
  },
  {
    id: "confirmation",
    label: "Επιβεβαίωση",
  },
];

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1,).padStart(2, "0");
  const day = String(now.getDate()).padStart(2,"0",);

  return `${year}-${month}-${day}`;
}

export function BookingPage() {

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState<BookingStep>("service");

    const [selectedServiceId, setSelectedServiceId] = useState(""); //service id of classic haircut, haircut & beard etc

    const [selectedBarberId, setSelectedBarberId] = useState(""); //which barber id of Alex, Nikos, Mario

    const [selectedDate, setSelectedDate] = useState(""); 

    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null); //e.g. 14:30

    const [notes, setNotes] = useState("");

    const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null); //success POST /appointments => new appointment

    const servicesQuery = useServices(); //React Query hook useServices
    const barbersQuery = useBarbers(); //React Query hook useBarbers

    const availabilityQuery = useAvailability({
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        date: selectedDate,
    }); //React Query hook useAvailability

    const selectedService = useMemo( //computed value based on selectedServiceId
        () => //will be executed when needed
        servicesQuery.data?.find(
            (service) =>
            service.id === selectedServiceId,
        ) ?? null, //convert to null if servicesQuery returns undefined
        [servicesQuery.data, selectedServiceId],  
    );

    const availableBarbers = useMemo(() => {
        if (!barbersQuery.data || !selectedServiceId) {
            return [];
        }

        return barbersQuery.data.filter((barber) =>
            barber.services.some( //some returns true if there is at least one service with the selected id and it stops
                (service) =>
                service.id === selectedServiceId,
            ),
        );
    }, [barbersQuery.data, selectedServiceId]);

    const createAppointmentMutation = useMutation({
        mutationFn: createAppointment,

        onSuccess: async (appointment) => {
          setCreatedAppointment(appointment);

          await queryClient.invalidateQueries({ //invalidateQueries 
            queryKey: [
              "availability",
              selectedBarberId,
              selectedServiceId,
              selectedDate,
            ],
        });
        },
    });

    const selectedBarber = useMemo(
        () => 
            barbersQuery.data?.find(
            (barber) => barber.id === selectedBarberId,
            ) ?? null,
        [barbersQuery.data, selectedBarberId],
    );

    function selectService(service: Service) { //service that user clicked on
        setSelectedServiceId(service.id);
        //clear the options for next appointments
        setSelectedBarberId("");
        setSelectedDate("");
        setSelectedSlot(null);

        setCurrentStep("barber");
    }

    function selectBarber(barber: Barber) {
        setSelectedBarberId(barber.id);
        //clear the options for next appointments
        setSelectedDate("");
        setSelectedSlot(null);
        setCurrentStep("date");
    }

    function goBack() {
        if (currentStep === "barber") {
            setCurrentStep("service");
            return;
        }

        if (currentStep === "date") {
            setCurrentStep("barber");
            return;
        }

        if (currentStep === "confirmation") {
            setCurrentStep("date");
        }
    }

    async function confirmAppointment() {
        if (
            !selectedBarberId ||
            !selectedServiceId ||
            !selectedSlot
        ) {
            return;
        }

        await createAppointmentMutation.mutateAsync({
            barberId: selectedBarberId,
            serviceId: selectedServiceId,
            startsAt: selectedSlot.localStartsAt,
            notes: notes.trim() || undefined,
        });
    }

    const currentStepIndex = steps.findIndex(
        (step) => step.id === currentStep,
    );

    if (createdAppointment) {
        return (
            <BookingSuccess
                appointment={createdAppointment}
                onFinish={() => {
                    navigate("/", {
                        replace: true,
                    });
                }}
            />
        );
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

            <div className="relative mx-auto max-w-5xl">
                <div className="flex items-center justify-between gap-5">
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
                </div>

                <div className="mt-10">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3.5 py-1.5 text-sm font-medium text-orange-600">
                    <ScissorsIcon className="size-3.5" />
                    Online booking
                    </div>

                    <h1 className="mt-6 font-serif text-4xl tracking-[-0.035em] text-slate-900 sm:text-5xl">
                    Κλείσε το επόμενο σου ραντεβού.
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                    Επίλεξε υπηρεσία, barber, ημερομηνία
                    και διαθέσιμη ώρα.
                    </p>
                </div>

                <div className="mx-auto mt-10 grid max-w-2xl grid-cols-4 gap-2">
                    {steps.map((step, index) => {
                    const isActive =
                        index === currentStepIndex;

                    const isCompleted =
                        index < currentStepIndex;

                    return (
                        <div
                        key={step.id}
                        className="text-center"
                        >
                        <div
                            className={[
                            "mx-auto flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition",
                            isActive
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "",
                            isCompleted
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "",
                            !isActive && !isCompleted
                                ? "border-black/10 bg-white text-gray-400"
                                : "",
                            ].join(" ")}
                        >
                            {isCompleted ? (
                            <CheckIcon className="size-4" />
                            ) : (
                            index + 1
                            )}
                        </div>

                        <p
                            className={[
                            "mt-2 hidden text-xs sm:block",
                            isActive
                                ? "font-semibold text-slate-800"
                                : "text-gray-400",
                            ].join(" ")}
                        >
                            {step.label}
                        </p>
                        </div>
                    );
                    })}
                </div>
                </div>

                <div className="mt-10 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.09)]">
                <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
                    <div className="size-3 rounded-full bg-red-400" />
                    <div className="size-3 rounded-full bg-amber-400" />
                    <div className="size-3 rounded-full bg-emerald-400" />

                    <div className="mx-4 h-5 max-w-xs flex-1 rounded-md bg-white/80" />
                </div>

                <div className="bg-[#f7f7f7] p-4 sm:p-7">
                    {currentStep === "service" && (
                    <ServiceStep
                        services={servicesQuery.data ?? []}
                        isLoading={servicesQuery.isPending}
                        isError={servicesQuery.isError}
                        selectedServiceId={
                        selectedServiceId
                        }
                        onSelect={selectService}
                    />
                    )}

                    {currentStep === "barber" && (
                      <BarberStep
                          barbers={availableBarbers}
                          isLoading={barbersQuery.isPending}
                          isError={barbersQuery.isError}
                          selectedBarberId={
                          selectedBarberId
                          }
                          onSelect={selectBarber}
                      />
                    )}

                    {currentStep === "date" && (
                    <DateStep
                        selectedDate={selectedDate}
                        onDateChange={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                        }}
                        slots={
                        availabilityQuery.data?.slots ??
                        []
                        }
                        isLoading={
                        availabilityQuery.isFetching
                        }
                        isError={availabilityQuery.isError}
                        isWorkingDay={
                        availabilityQuery.data
                            ?.isWorkingDay
                        }
                        selectedSlot={selectedSlot}
                        onSlotSelect={setSelectedSlot}
                        onContinue={() =>
                        setCurrentStep("confirmation")
                        }
                    />
                    )}

                    {currentStep === "confirmation" &&
                      selectedService &&
                      selectedBarber &&
                      selectedSlot && (
                        <ConfirmationStep
                          service={selectedService}
                          barber={selectedBarber}
                          date={selectedDate}
                          slot={selectedSlot}
                          notes={notes}
                          onNotesChange={setNotes}
                          onConfirm={() => {
                              void confirmAppointment();
                          }}
                          isSubmitting={
                              createAppointmentMutation.isPending
                          }
                          error={
                              createAppointmentMutation.error
                          }
                        />
                    )}
                </div>
                </div>

                {currentStep !== "service" && (
                <button
                    type="button"
                    onClick={goBack}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-slate-900"
                >
                    <ArrowLeftIcon className="size-4" />
                    Προηγούμενο βήμα
                </button>
                )}
            </div>
        </main>
    );



}



type ServiceStepProps = {
  services: Service[];
  isLoading: boolean;
  isError: boolean;
  selectedServiceId: string;
  onSelect: (service: Service) => void;
};

function ServiceStep({
  services,
  isLoading,
  isError,
  selectedServiceId,
  onSelect,
}: ServiceStepProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState message="Δεν ήταν δυνατή η φόρτωση των υπηρεσιών." />
    );
  }

  return (
    <section>
      <h2 className="font-serif text-3xl text-slate-900">
        Επίλεξε υπηρεσία
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Ποια υπηρεσία θέλεις να κλείσεις;
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {services.map((service) => {
          const isSelected =
            selectedServiceId === service.id;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={[
                "group rounded-2xl border bg-white p-5 text-left transition",
                isSelected
                  ? "border-orange-400 ring-4 ring-orange-50"
                  : "border-black/[0.06] hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg",
              ].join(" ")}
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <ScissorsIcon className="size-5" />
              </div>

              <h3 className="mt-6 font-serif text-2xl text-slate-900">
                {service.name}
              </h3>

              <p className="mt-3 min-h-12 text-sm leading-6 text-gray-500">
                {service.description}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-4">
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock3Icon className="size-4 text-orange-500" />
                  {service.duration} λεπτά
                </span>

                <span className="font-serif text-xl text-slate-900">
                  {new Intl.NumberFormat("el-GR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(service.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type BarberStepProps = {
  barbers: Barber[];
  isLoading: boolean;
  isError: boolean;
  selectedBarberId: string;
  onSelect: (barber: Barber) => void;
};

function BarberStep({
  barbers,
  isLoading,
  isError,
  selectedBarberId,
  onSelect,
}: BarberStepProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState message="Δεν ήταν δυνατή η φόρτωση των barbers." />
    );
  }

  return (
    <section>
      <h2 className="font-serif text-3xl text-slate-900">
        Επίλεξε barber
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Εμφανίζονται μόνο οι barbers που προσφέρουν
        την υπηρεσία σου.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {barbers.map((barber) => {
          const isSelected =
            selectedBarberId === barber.id;

          return (
            <button
              key={barber.id}
              type="button"
              onClick={() => onSelect(barber)}
              className={[
                "rounded-2xl border bg-white p-5 text-left transition",
                isSelected
                  ? "border-orange-400 ring-4 ring-orange-50"
                  : "border-black/6 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg",
              ].join(" ")}
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-white">
                <UserRoundIcon className="size-6" />
              </div>

              <h3 className="mt-5 font-serif text-2xl text-slate-900">
                {barber.name}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {barber.bio}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                Επιλογή
                <ArrowRightIcon className="size-4" />
              </div>
            </button>
          );
        })}
      </div>

      {barbers.length === 0 && (
        <div className="mt-7 rounded-2xl border border-black/[0.06] bg-white p-8 text-center text-sm text-gray-500">
          Δεν υπάρχει διαθέσιμος barber για αυτή την
          υπηρεσία.
        </div>
      )}
    </section>
  );
}

type DateStepProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
  slots: AvailableSlot[];
  isLoading: boolean;
  isError: boolean;
  isWorkingDay: boolean | undefined;
  selectedSlot: AvailableSlot | null;
  onSlotSelect: (slot: AvailableSlot) => void;
  onContinue: () => void;
};

function DateStep({
  selectedDate,
  onDateChange,
  slots,
  isLoading,
  isError,
  isWorkingDay,
  selectedSlot,
  onSlotSelect,
  onContinue,
}: DateStepProps) {
  return (
    <section>
      <h2 className="font-serif text-3xl text-slate-900">
        Επίλεξε ημερομηνία και ώρα
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Οι διαθέσιμες ώρες ενημερώνονται αυτόματα.
      </p>

      <label className="mt-7 block max-w-sm">
        <span className="text-sm font-medium text-slate-700">
          Ημερομηνία
        </span>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
          <CalendarDaysIcon className="size-4 text-orange-500" />

          <input
            type="date"
            min={getTodayDate()}
            value={selectedDate}
            onChange={(event) =>
              onDateChange(event.target.value)
            }
            className="h-12 flex-1 bg-transparent text-sm text-slate-800 outline-none"
          />
        </div>
      </label>

      {!selectedDate && (
        <div className="mt-7 rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-gray-400">
          Επίλεξε ημερομηνία για να δεις τις
          διαθέσιμες ώρες.
        </div>
      )}

      {selectedDate && isLoading && (
        <LoadingState />
      )}

      {selectedDate && isError && (
        <ErrorState message="Δεν ήταν δυνατός ο έλεγχος διαθεσιμότητας." />
      )}

      {selectedDate &&
        !isLoading &&
        !isError &&
        isWorkingDay === false && (
          <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50 p-7 text-center">
            <p className="font-medium text-orange-700">
              Ο barber δεν εργάζεται αυτή την ημέρα.
            </p>

            <p className="mt-2 text-sm text-orange-600/70">
              Επίλεξε κάποια άλλη ημερομηνία.
            </p>
          </div>
        )}

      {selectedDate &&
        !isLoading &&
        !isError &&
        isWorkingDay &&
        slots.length === 0 && (
          <div className="mt-7 rounded-2xl border border-black/[0.06] bg-white p-7 text-center">
            <p className="font-medium text-slate-700">
              Δεν υπάρχουν διαθέσιμα ραντεβού.
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Δοκίμασε κάποια άλλη ημερομηνία.
            </p>
          </div>
        )}

      {slots.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-slate-700">
            Διαθέσιμες ώρες
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((slot) => {
              const isSelected =
                selectedSlot?.startsAt ===
                slot.startsAt;

              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() =>
                    onSlotSelect(slot)
                  }
                  className={[
                    "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-100"
                      : "border-black/[0.07] bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50",
                  ].join(" ")}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedSlot && (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Συνέχεια
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}


type ConfirmationStepProps = {
  service: Service;
  barber: Barber;
  date: string;
  slot: AvailableSlot;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  error: Error | null;
};

function ConfirmationStep({
  service,
  barber,
  date,
  slot,
  notes,
  onNotesChange,
  onConfirm,
  isSubmitting,
  error,
}: ConfirmationStepProps) {
  const formattedDate = new Intl.DateTimeFormat(
    "el-GR",
    {
      dateStyle: "long",
    },
  ).format(new Date(`${date}T12:00:00`));

  return (
    <section>
      <h2 className="font-serif text-3xl text-slate-900">
        Επιβεβαίωση ραντεβού
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Έλεγξε τα στοιχεία πριν ολοκληρώσεις την
        κράτηση.
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
          <SummaryRow
            icon={
              <ScissorsIcon className="size-4" />
            }
            label="Υπηρεσία"
            value={service.name}
          />

          <SummaryRow
            icon={
              <UserRoundIcon className="size-4" />
            }
            label="Barber"
            value={barber.name}
          />

          <SummaryRow
            icon={
              <CalendarDaysIcon className="size-4" />
            }
            label="Ημερομηνία"
            value={formattedDate}
          />

          <SummaryRow
            icon={<Clock3Icon className="size-4" />}
            label="Ώρα"
            value={slot.label}
          />

          <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-5">
            <span className="text-sm text-gray-500">
              Συνολικό ποσό
            </span>

            <span className="font-serif text-3xl text-slate-900">
              {new Intl.NumberFormat("el-GR", {
                style: "currency",
                currency: "EUR",
              }).format(service.price)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Σημειώσεις
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                onNotesChange(event.target.value)
              }
              maxLength={500}
              rows={5}
              placeholder="Προαιρετικές σημειώσεις για τον barber..."
              className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white p-4 text-sm text-slate-800 outline-none transition placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error instanceof ApiError
                ? error.message
                : "Δεν ήταν δυνατή η δημιουργία του ραντεβού."}
            </div>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}

            Επιβεβαίωση ραντεβού
          </button>
        </div>
      </div>
    </section>
  );
}

type SummaryRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function SummaryRow({
  icon,
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-black/[0.06] py-4 first:pt-0">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          {icon}
        </div>

        <span className="text-sm text-gray-500">
          {label}
        </span>
      </div>

      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <LoaderCircleIcon className="size-7 animate-spin text-orange-500" />
    </div>
  );
}

type ErrorStateProps = {
  message: string;
};

function ErrorState({
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
      <p className="font-medium text-red-700">
        {message}
      </p>
    </div>
  );
}


type BookingSuccessProps = {
  appointment: CreatedAppointment;
  onFinish: () => void;
};

function BookingSuccess({
  appointment,
  onFinish,
}: BookingSuccessProps) {
  const localStart = new Date(
    appointment.localStartsAt,
  );

  const formattedDate = new Intl.DateTimeFormat(
    "el-GR",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  ).format(localStart);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.07] bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckIcon className="size-7" />
        </div>

        <h1 className="mt-7 font-serif text-4xl text-slate-900">
          Το ραντεβού δημιουργήθηκε.
        </h1>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          Η κράτησή σου έχει καταχωριστεί επιτυχώς.
        </p>

        <div className="mt-7 rounded-2xl border border-black/[0.06] bg-[#f7f7f7] p-5 text-left">
          <p className="text-sm text-gray-500">
            Υπηρεσία
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {appointment.service.name}
          </p>

          <p className="mt-5 text-sm text-gray-500">
            Barber
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {appointment.barber.name}
          </p>

          <p className="mt-5 text-sm text-gray-500">
            Ημερομηνία και ώρα
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {formattedDate}
          </p>
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Επιστροφή στην αρχική
        </button>
      </div>
    </main>
  );
}