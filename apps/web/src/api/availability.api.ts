import { apiRequest } from "./api-client";

export type AvailableSlot = {
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  label: string;
};

export type AvailabilityData = {
  barber: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
  date: string;
  timeZone: string;
  isWorkingDay: boolean;
  workingHours?: {
    startTime: string;
    endTime: string;
  };
  slots: AvailableSlot[];
};

type AvailabilityResponse = {
  data: AvailabilityData;
};

type GetAvailabilityInput = {
  barberId: string;
  serviceId: string;
  date: string;
};

export async function getAvailableSlots({
  barberId,
  serviceId,
  date,
}: GetAvailabilityInput) {
  const params = new URLSearchParams({
    serviceId,
    date,
  });

  const response =
    await apiRequest<AvailabilityResponse>(
      `/barbers/${barberId}/available-slots?${params.toString()}`,
    );

  return response.data;
}