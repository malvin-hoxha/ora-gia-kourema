import { apiRequest } from "./api-client";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type CreateAppointmentInput = {
  barberId: string;
  serviceId: string;
  startsAt: string;
  notes?: string;
};

export type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  timeZone: string;

  cancelledAt: string | null;

  cancelledBy:
    | "CUSTOMER"
    | "BARBER"
    | "ADMIN"
    | "SYSTEM"
    | null;

  cancellationReason: string | null;

  barber: {
    id: string;
    name: string;
    imageUrl: string | null;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };
};

export type CreatedAppointment = Appointment;

export type MyAppointments = {
  upcoming: Appointment[];
  history: Appointment[];
};

type CreateAppointmentResponse = {
  message: string;
  data: CreatedAppointment;
};

type MyAppointmentsResponse = {
  data: MyAppointments;
};

type CancelAppointmentResponse = {
  message: string;
  data: Appointment;
};



export async function createAppointment(
  input: CreateAppointmentInput,
) {
  const response =
    await apiRequest<CreateAppointmentResponse>(
      "/appointments",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data;
}

export async function getMyAppointments() {
  const response =
    await apiRequest<MyAppointmentsResponse>(
      "/appointments/me",
    );

  return response.data;
}

export async function cancelAppointment(
  appointmentId: string,
) {
  const response =
    await apiRequest<CancelAppointmentResponse>(
      `/appointments/${appointmentId}/cancel`,
      {
        method: "PATCH",
      },
    );

  return response.data;
}