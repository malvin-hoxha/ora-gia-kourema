import { useQuery } from "@tanstack/react-query";
import { getAvailableSlots } from "../api/availability.api";

type UseAvailabilityInput = {
  barberId: string;
  serviceId: string;
  date: string;
};

export function useAvailability({
  barberId,
  serviceId,
  date,
}: UseAvailabilityInput) {
  return useQuery({
    queryKey: [
      "availability",
      barberId,
      serviceId,
      date,
    ],
    queryFn: () =>
      getAvailableSlots({
        barberId,
        serviceId,
        date,
      }),
    enabled:
      Boolean(barberId) &&
      Boolean(serviceId) &&
      Boolean(date),
    staleTime: 15_000,
  });
}