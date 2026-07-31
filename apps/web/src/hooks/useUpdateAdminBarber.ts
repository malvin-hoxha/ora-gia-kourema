import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateAdminBarber } from "../api/admin-barbers.api";
import { adminOverviewQueryKey } from "./useAdminOverview";
import { adminBarbersQueryKey } from "./useAdminBarbers";
import { adminBarberUsersQueryKey } from "./useAdminBarberUsers";
import { adminAppointmentsQueryKeys } from "./useAdminAppointments";

export function useUpdateAdminBarber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminBarber,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminBarbersQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminBarberUsersQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminOverviewQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminAppointmentsQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["barbers"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "admin-barber-details",
          ],
        }),
      ]);
    },
  });
}
