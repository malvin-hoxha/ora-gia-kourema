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
  return useQuery({ // key for the cache like [availability, barberId, serviceId, date] in useEffect 
    queryKey: [
      "availability",
      barberId,
      serviceId,
      date,
    ],
    queryFn: () => //queryFn needs empty parameter but getAvailableSlots needs them
      getAvailableSlots({
        barberId,
        serviceId,
        date,
      }),
    enabled: //do not request until these are defined, => good for forms
      Boolean(barberId) &&
      Boolean(serviceId) &&
      Boolean(date),
    staleTime: 15_000,
  });
}