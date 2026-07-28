import { apiRequest } from "./api-client";

export type CreateAppointmentInput = {
  barberId: string;
  serviceId: string;
  startsAt: string;
  notes?: string;
};

export type CreatedAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  status: "PENDING" | "CONFIRMED";
  notes: string | null;
  timeZone: string;
  barber: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };
};

type CreateAppointmentResponse = {
  message: string;
  data: CreatedAppointment;
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