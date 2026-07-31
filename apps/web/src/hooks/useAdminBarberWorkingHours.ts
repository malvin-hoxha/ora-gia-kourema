import { useQuery } from "@tanstack/react-query";
import {
  getAdminBarberWorkingHours,
} from "../api/admin-barbers.api";

export const adminBarberWorkingHoursQueryKey = (
  barberId: string,
) =>
  [
    "admin-barber-working-hours",
    barberId,
  ] as const;

export function useAdminBarberWorkingHours(
  barberId: string | null,
) {
  return useQuery({
    queryKey:
      adminBarberWorkingHoursQueryKey(
        barberId ?? "",
      ),

    queryFn: () => {
      if (!barberId) {
        throw new Error(
          "Barber id is required",
        );
      }

      return getAdminBarberWorkingHours(
        barberId,
      );
    },

    enabled: Boolean(barberId),

    staleTime: 30_000,
  });
}