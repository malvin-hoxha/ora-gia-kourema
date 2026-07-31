import { useQuery } from "@tanstack/react-query";
import {
  getAdminBarberDetails,
} from "../api/admin-barbers.api";

export const adminBarberDetailsQueryKey = (
  barberId: string,
) =>
  [
    "admin-barber-details",
    barberId,
  ] as const;

export function useAdminBarberDetails(
  barberId: string | null,
) {
  return useQuery({
    queryKey:
      adminBarberDetailsQueryKey(
        barberId ?? "",
      ),

    queryFn: () => {
      if (!barberId) {
        throw new Error(
          "Barber id is required",
        );
      }

      return getAdminBarberDetails(
        barberId,
      );
    },

    enabled: Boolean(barberId),

    staleTime: 30_000,
  });
}